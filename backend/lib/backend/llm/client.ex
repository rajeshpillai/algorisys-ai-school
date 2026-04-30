defmodule Backend.LLM.Client do
  @moduledoc """
  Unified LLM client supporting OpenAI, Anthropic, and Ollama APIs.
  """

  require Logger

  @default_models %{
    openai: "gpt-4o",
    anthropic: "claude-sonnet-4-20250514",
    ollama: "llama3"
  }

  @doc """
  Send a chat completion request (non-streaming).

  ## Options
    * `:model` - model name override
    * `:temperature` - sampling temperature (default 0.7)
    * `:max_tokens` - max response tokens (default 4096)
    * `:provider` - override provider from config (:openai | :anthropic | :ollama)
  """
  @spec chat(list(map()), keyword()) :: {:ok, String.t()} | {:error, term()}
  def chat(messages, opts \\ []) do
    provider = resolve_provider(opts)
    model = Keyword.get(opts, :model, @default_models[provider])
    temperature = Keyword.get(opts, :temperature, 0.7)
    max_tokens = Keyword.get(opts, :max_tokens, 4096)

    config = resolved_config(opts)

    case provider do
      :openai -> chat_openai(messages, model, temperature, max_tokens, config)
      :anthropic -> chat_anthropic(messages, model, temperature, max_tokens, config)
      :ollama -> chat_ollama(messages, model, temperature, max_tokens, config)
      other -> {:error, {:unsupported_provider, other}}
    end
  end

  @doc """
  Send a chat completion request and parse the response as JSON.

  Automatically appends "Respond with valid JSON only." to the system message
  if not already present. Strips markdown code fences before parsing.
  """
  @spec chat_json(list(map()), keyword()) :: {:ok, map()} | {:error, term()}
  def chat_json(messages, opts \\ []) do
    messages = ensure_json_instruction(messages)

    case chat(messages, opts) do
      {:ok, text} ->
        text
        |> strip_code_fences()
        |> Jason.decode()
        |> case do
          {:ok, parsed} -> {:ok, parsed}
          {:error, _} = err -> err
        end

      {:error, _} = err ->
        err
    end
  end

  # --- Provider implementations ---

  defp chat_openai(messages, model, temperature, max_tokens, config) do
    api_key = config[:openai_api_key]

    body = %{
      model: model,
      messages: format_messages_openai(messages),
      temperature: temperature,
      max_tokens: max_tokens
    }

    case Req.post("https://api.openai.com/v1/chat/completions",
           json: body,
           headers: [
             {"authorization", "Bearer #{api_key}"},
             {"content-type", "application/json"}
           ],
           receive_timeout: 120_000
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, get_in(body, ["choices", Access.at(0), "message", "content"])}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.error("OpenAI API error: status=#{status} body=#{inspect(body)}")
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("OpenAI request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp chat_anthropic(messages, model, temperature, max_tokens, config) do
    api_key = config[:anthropic_api_key]

    {system_text, non_system_messages} = extract_system_message(messages)

    body =
      %{
        model: model,
        messages: format_messages_anthropic(non_system_messages),
        temperature: temperature,
        max_tokens: max_tokens
      }
      |> maybe_add_system(system_text)

    case Req.post("https://api.anthropic.com/v1/messages",
           json: body,
           headers: [
             {"x-api-key", api_key},
             {"anthropic-version", "2023-06-01"},
             {"content-type", "application/json"}
           ],
           receive_timeout: 120_000
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        content =
          body
          |> Map.get("content", [])
          |> Enum.filter(&(&1["type"] == "text"))
          |> Enum.map_join("", & &1["text"])

        {:ok, content}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.error("Anthropic API error: status=#{status} body=#{inspect(body)}")
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("Anthropic request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp chat_ollama(messages, model, temperature, max_tokens, config) do
    base_url = config[:ollama_base_url] || "http://localhost:11434"

    body = %{
      model: model,
      messages: format_messages_openai(messages),
      stream: false,
      options: %{
        temperature: temperature,
        num_predict: max_tokens
      }
    }

    case Req.post("#{base_url}/api/chat",
           json: body,
           headers: [{"content-type", "application/json"}],
           receive_timeout: 300_000
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, get_in(body, ["message", "content"])}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.error("Ollama API error: status=#{status} body=#{inspect(body)}")
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("Ollama request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  # --- Helpers ---

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

  defp format_messages_openai(messages) do
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

  defp format_messages_anthropic(messages) do
    Enum.map(messages, fn msg ->
      %{
        "role" => to_string(msg[:role] || msg["role"]),
        "content" => to_string(msg[:content] || msg["content"])
      }
    end)
  end

  defp maybe_add_system(body, ""), do: body
  defp maybe_add_system(body, system_text), do: Map.put(body, :system, system_text)

  defp ensure_json_instruction(messages) do
    json_instruction = "Respond with valid JSON only."

    case Enum.reverse(messages) do
      [] ->
        [%{role: "system", content: json_instruction}]

      _reversed ->
        # Find the last system message or append instruction to the last one
        has_json_instruction? =
          Enum.any?(messages, fn msg ->
            role = to_string(msg[:role] || msg["role"])
            content = to_string(msg[:content] || msg["content"])
            role == "system" and String.contains?(content, json_instruction)
          end)

        if has_json_instruction? do
          messages
        else
          # Find and update the last system message, or prepend a new one
          system_index =
            messages
            |> Enum.with_index()
            |> Enum.filter(fn {msg, _idx} ->
              to_string(msg[:role] || msg["role"]) == "system"
            end)
            |> List.last()

          case system_index do
            {msg, idx} ->
              content = to_string(msg[:content] || msg["content"])
              updated = Map.put(msg, :content, content <> "\n\n" <> json_instruction)
              List.replace_at(messages, idx, updated)

            nil ->
              [%{role: "system", content: json_instruction} | messages]
          end
        end
    end
  end

  defp strip_code_fences(text) do
    text = String.trim(text)

    cond do
      String.starts_with?(text, "```json") ->
        text
        |> String.trim_leading("```json")
        |> String.trim_trailing("```")
        |> String.trim()

      String.starts_with?(text, "```") ->
        text
        |> String.trim_leading("```")
        |> String.trim_trailing("```")
        |> String.trim()

      true ->
        text
    end
  end
end
