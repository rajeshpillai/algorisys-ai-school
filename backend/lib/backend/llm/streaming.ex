defmodule Backend.LLM.Streaming do
  @moduledoc """
  Handles streaming LLM responses via SSE.

  Streams chat completions from OpenAI, Anthropic, or Ollama,
  calling a callback function for each chunk of the response.
  """

  require Logger

  @default_models %{
    openai: "gpt-4o",
    anthropic: "claude-sonnet-4-20250514",
    ollama: "llama3"
  }

  @doc """
  Stream a chat completion, calling `callback` for each chunk.

  The callback receives one of:
    * `{:chunk, text}` - a partial text chunk
    * `{:done, full_text}` - streaming is complete with the accumulated text
    * `{:error, reason}` - an error occurred

  Returns `:ok` or `{:error, reason}`.
  """
  @spec stream_chat(list(map()), function(), keyword()) :: :ok | {:error, term()}
  def stream_chat(messages, callback, opts \\ []) do
    provider = resolve_provider(opts)
    model = Keyword.get(opts, :model, @default_models[provider])
    temperature = Keyword.get(opts, :temperature, 0.7)
    max_tokens = Keyword.get(opts, :max_tokens, 4096)

    config = resolved_config(opts)

    case provider do
      :openai -> stream_openai(messages, model, temperature, max_tokens, callback, config)
      :anthropic -> stream_anthropic(messages, model, temperature, max_tokens, callback, config)
      :ollama -> stream_ollama(messages, model, temperature, max_tokens, callback, config)
      other -> {:error, {:unsupported_provider, other}}
    end
  end

  # --- OpenAI streaming ---

  defp stream_openai(messages, model, temperature, max_tokens, callback, config) do
    api_key = config[:openai_api_key]

    body = %{
      model: model,
      messages: format_messages(messages),
      temperature: temperature,
      max_tokens: max_tokens,
      stream: true
    }

    acc = %{buffer: "", full_text: ""}

    into_fun = fn {:data, data}, {req, resp} ->
      acc_ref = Process.get(:stream_acc, acc)
      new_buffer = acc_ref.buffer <> data

      {lines, remaining} = split_sse_lines(new_buffer)
      new_acc = process_openai_lines(lines, acc_ref, callback)
      new_acc = %{new_acc | buffer: remaining}

      Process.put(:stream_acc, new_acc)
      {:cont, {req, resp}}
    end

    Process.put(:stream_acc, acc)

    result =
      Req.post("https://api.openai.com/v1/chat/completions",
        json: body,
        headers: [
          {"authorization", "Bearer #{api_key}"},
          {"content-type", "application/json"}
        ],
        into: into_fun,
        receive_timeout: 300_000
      )

    final_acc = Process.get(:stream_acc, acc)
    Process.delete(:stream_acc)

    case result do
      {:ok, %Req.Response{status: 200}} ->
        callback.({:done, final_acc.full_text})
        :ok

      {:ok, %Req.Response{status: status, body: body}} ->
        reason = {:api_error, status, body}
        callback.({:error, reason})
        {:error, reason}

      {:error, reason} ->
        callback.({:error, reason})
        {:error, {:request_failed, reason}}
    end
  end

  defp process_openai_lines(lines, acc, callback) do
    Enum.reduce(lines, acc, fn line, acc ->
      line = String.trim(line)

      cond do
        line == "" ->
          acc

        line == "data: [DONE]" ->
          acc

        String.starts_with?(line, "data: ") ->
          json_str = String.trim_leading(line, "data: ")

          case Jason.decode(json_str) do
            {:ok, %{"choices" => [%{"delta" => %{"content" => content}} | _]}}
            when is_binary(content) and content != "" ->
              callback.({:chunk, content})
              %{acc | full_text: acc.full_text <> content}

            _ ->
              acc
          end

        true ->
          acc
      end
    end)
  end

  # --- Anthropic streaming ---

  defp stream_anthropic(messages, model, temperature, max_tokens, callback, config) do
    api_key = config[:anthropic_api_key]

    {system_text, non_system_messages} = extract_system_message(messages)

    body =
      %{
        model: model,
        messages: format_messages(non_system_messages),
        temperature: temperature,
        max_tokens: max_tokens,
        stream: true
      }
      |> maybe_add_system(system_text)

    acc = %{buffer: "", full_text: ""}

    into_fun = fn {:data, data}, {req, resp} ->
      acc_ref = Process.get(:stream_acc, acc)
      new_buffer = acc_ref.buffer <> data

      {lines, remaining} = split_sse_lines(new_buffer)
      new_acc = process_anthropic_lines(lines, acc_ref, callback)
      new_acc = %{new_acc | buffer: remaining}

      Process.put(:stream_acc, new_acc)
      {:cont, {req, resp}}
    end

    Process.put(:stream_acc, acc)

    result =
      Req.post("https://api.anthropic.com/v1/messages",
        json: body,
        headers: [
          {"x-api-key", api_key},
          {"anthropic-version", "2023-06-01"},
          {"content-type", "application/json"}
        ],
        into: into_fun,
        receive_timeout: 300_000
      )

    final_acc = Process.get(:stream_acc, acc)
    Process.delete(:stream_acc)

    case result do
      {:ok, %Req.Response{status: 200}} ->
        callback.({:done, final_acc.full_text})
        :ok

      {:ok, %Req.Response{status: status, body: body}} ->
        reason = {:api_error, status, body}
        callback.({:error, reason})
        {:error, reason}

      {:error, reason} ->
        callback.({:error, reason})
        {:error, {:request_failed, reason}}
    end
  end

  defp process_anthropic_lines(lines, acc, callback) do
    Enum.reduce(lines, acc, fn line, acc ->
      line = String.trim(line)

      cond do
        line == "" ->
          acc

        String.starts_with?(line, "data: ") ->
          json_str = String.trim_leading(line, "data: ")

          case Jason.decode(json_str) do
            {:ok, %{"type" => "content_block_delta", "delta" => %{"text" => text}}}
            when is_binary(text) ->
              callback.({:chunk, text})
              %{acc | full_text: acc.full_text <> text}

            _ ->
              acc
          end

        true ->
          acc
      end
    end)
  end

  # --- Ollama streaming ---

  defp stream_ollama(messages, model, temperature, max_tokens, callback, config) do
    base_url = config[:ollama_base_url] || "http://localhost:11434"

    body = %{
      model: model,
      messages: format_messages(messages),
      stream: true,
      options: %{
        temperature: temperature,
        num_predict: max_tokens
      }
    }

    acc = %{buffer: "", full_text: ""}

    into_fun = fn {:data, data}, {req, resp} ->
      acc_ref = Process.get(:stream_acc, acc)
      new_buffer = acc_ref.buffer <> data

      {lines, remaining} = split_ndjson_lines(new_buffer)
      new_acc = process_ollama_lines(lines, acc_ref, callback)
      new_acc = %{new_acc | buffer: remaining}

      Process.put(:stream_acc, new_acc)
      {:cont, {req, resp}}
    end

    Process.put(:stream_acc, acc)

    result =
      Req.post("#{base_url}/api/chat",
        json: body,
        headers: [{"content-type", "application/json"}],
        into: into_fun,
        receive_timeout: 300_000
      )

    final_acc = Process.get(:stream_acc, acc)
    Process.delete(:stream_acc)

    case result do
      {:ok, %Req.Response{status: 200}} ->
        callback.({:done, final_acc.full_text})
        :ok

      {:ok, %Req.Response{status: status, body: body}} ->
        reason = {:api_error, status, body}
        callback.({:error, reason})
        {:error, reason}

      {:error, reason} ->
        callback.({:error, reason})
        {:error, {:request_failed, reason}}
    end
  end

  defp process_ollama_lines(lines, acc, callback) do
    Enum.reduce(lines, acc, fn line, acc ->
      line = String.trim(line)

      if line == "" do
        acc
      else
        case Jason.decode(line) do
          {:ok, %{"message" => %{"content" => content}, "done" => false}}
          when is_binary(content) and content != "" ->
            callback.({:chunk, content})
            %{acc | full_text: acc.full_text <> content}

          _ ->
            acc
        end
      end
    end)
  end

  # --- Shared helpers ---

  defp split_sse_lines(buffer) do
    # SSE events are separated by double newlines, but individual data lines
    # are separated by single newlines. We split on newlines and keep the
    # last incomplete line as the remaining buffer.
    case String.split(buffer, "\n") do
      [] ->
        {[], buffer}

      parts ->
        {complete, [remaining]} = Enum.split(parts, -1)
        {complete, remaining}
    end
  end

  defp split_ndjson_lines(buffer) do
    case String.split(buffer, "\n") do
      [] ->
        {[], buffer}

      parts ->
        {complete, [remaining]} = Enum.split(parts, -1)
        {complete, remaining}
    end
  end

  defp resolve_provider(opts) do
    case Keyword.get(opts, :provider) do
      nil ->
        config = resolved_config(opts)
        provider_string = config[:provider] || "openai"
        String.to_existing_atom(provider_string)

      provider when is_atom(provider) ->
        provider

      provider when is_binary(provider) ->
        String.to_existing_atom(provider)
    end
  end

  defp resolved_config(opts) do
    base = Application.get_env(:backend, :llm, [])

    case Keyword.get(opts, :llm_config) do
      nil ->
        base

      override when is_map(override) ->
        overrides =
          [
            if(override["provider"], do: {:provider, override["provider"]}),
            if(override["openai_api_key"], do: {:openai_api_key, override["openai_api_key"]}),
            if(override["anthropic_api_key"],
              do: {:anthropic_api_key, override["anthropic_api_key"]}
            ),
            if(override["ollama_base_url"], do: {:ollama_base_url, override["ollama_base_url"]})
          ]
          |> Enum.reject(&is_nil/1)

        Keyword.merge(base, overrides)

      _ ->
        base
    end
  end

  defp format_messages(messages) do
    Enum.map(messages, fn msg ->
      %{
        "role" => to_string(msg[:role] || msg["role"]),
        "content" => to_string(msg[:content] || msg["content"])
      }
    end)
  end

  defp extract_system_message(messages) do
    {system_msgs, other_msgs} =
      Enum.split_with(messages, fn msg ->
        role = msg[:role] || msg["role"]
        to_string(role) == "system"
      end)

    system_text =
      system_msgs
      |> Enum.map(fn msg -> to_string(msg[:content] || msg["content"]) end)
      |> Enum.join("\n\n")

    {system_text, other_msgs}
  end

  defp maybe_add_system(body, ""), do: body
  defp maybe_add_system(body, system_text), do: Map.put(body, :system, system_text)
end
