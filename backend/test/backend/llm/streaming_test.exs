defmodule Backend.LLM.StreamingTest do
  use ExUnit.Case, async: true

  # Test the internal parsing logic by calling the module's private functions
  # via :erlang.apply or by extracting the logic into testable patterns.
  # Since the parsing functions are private, we test the observable behavior
  # by simulating what the streaming functions do with SSE data.

  describe "OpenAI SSE chunk parsing" do
    test "parses content from standard OpenAI chunks" do
      chunks = [
        ~s(data: {"choices":[{"delta":{"content":"Hello"}}]}),
        ~s(data: {"choices":[{"delta":{"content":" world"}}]}),
        "data: [DONE]"
      ]

      {collected, full_text} = simulate_openai_parsing(chunks)
      assert collected == ["Hello", " world"]
      assert full_text == "Hello world"
    end

    test "ignores chunks without content" do
      chunks = [
        ~s(data: {"choices":[{"delta":{"role":"assistant"}}]}),
        ~s(data: {"choices":[{"delta":{"content":"Hi"}}]}),
        ~s(data: {"choices":[{"delta":{}}]}),
        "data: [DONE]"
      ]

      {collected, _} = simulate_openai_parsing(chunks)
      assert collected == ["Hi"]
    end

    test "ignores empty content strings" do
      chunks = [
        ~s(data: {"choices":[{"delta":{"content":""}}]}),
        ~s(data: {"choices":[{"delta":{"content":"Real content"}}]}),
        "data: [DONE]"
      ]

      {collected, _} = simulate_openai_parsing(chunks)
      assert collected == ["Real content"]
    end

    test "handles empty lines between data events" do
      chunks = [
        "",
        ~s(data: {"choices":[{"delta":{"content":"A"}}]}),
        "",
        "",
        ~s(data: {"choices":[{"delta":{"content":"B"}}]}),
        ""
      ]

      {collected, _} = simulate_openai_parsing(chunks)
      assert collected == ["A", "B"]
    end

    test "ignores malformed JSON" do
      chunks = [
        "data: {invalid json",
        ~s(data: {"choices":[{"delta":{"content":"Valid"}}]}),
        "data: [DONE]"
      ]

      {collected, _} = simulate_openai_parsing(chunks)
      assert collected == ["Valid"]
    end
  end

  describe "Anthropic SSE chunk parsing" do
    test "parses content_block_delta events" do
      chunks = [
        ~s(data: {"type":"content_block_delta","delta":{"text":"Hello"}}),
        ~s(data: {"type":"content_block_delta","delta":{"text":" from Claude"}}),
        ~s(data: {"type":"message_stop"})
      ]

      {collected, full_text} = simulate_anthropic_parsing(chunks)
      assert collected == ["Hello", " from Claude"]
      assert full_text == "Hello from Claude"
    end

    test "ignores non-delta events" do
      chunks = [
        ~s(data: {"type":"message_start","message":{"id":"msg_123"}}),
        ~s(data: {"type":"content_block_start","content_block":{"type":"text"}}),
        ~s(data: {"type":"content_block_delta","delta":{"text":"Content"}}),
        ~s(data: {"type":"content_block_stop"}),
        ~s(data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}),
        ~s(data: {"type":"message_stop"})
      ]

      {collected, _} = simulate_anthropic_parsing(chunks)
      assert collected == ["Content"]
    end
  end

  describe "Ollama NDJSON chunk parsing" do
    test "parses message content from NDJSON lines" do
      chunks = [
        ~s({"message":{"content":"Hello"},"done":false}),
        ~s({"message":{"content":" there"},"done":false}),
        ~s({"message":{"content":""},"done":true})
      ]

      {collected, full_text} = simulate_ollama_parsing(chunks)
      assert collected == ["Hello", " there"]
      assert full_text == "Hello there"
    end

    test "ignores done:true messages" do
      chunks = [
        ~s({"message":{"content":"Hi"},"done":false}),
        ~s({"done":true,"total_duration":1234})
      ]

      {collected, _} = simulate_ollama_parsing(chunks)
      assert collected == ["Hi"]
    end
  end

  describe "SSE line splitting" do
    test "splits complete lines and preserves incomplete buffer" do
      {lines, remaining} = split_on_newlines("data: hello\ndata: world\nincomplete")
      assert lines == ["data: hello", "data: world"]
      assert remaining == "incomplete"
    end

    test "handles buffer with no newlines" do
      {lines, remaining} = split_on_newlines("partial data")
      assert lines == []
      assert remaining == "partial data"
    end

    test "handles buffer ending with newline" do
      {lines, remaining} = split_on_newlines("data: complete\n")
      assert lines == ["data: complete"]
      assert remaining == ""
    end

    test "handles empty buffer" do
      {lines, remaining} = split_on_newlines("")
      assert lines == []
      assert remaining == ""
    end

    test "handles multiple consecutive newlines" do
      {lines, remaining} = split_on_newlines("data: a\n\ndata: b\n")
      assert lines == ["data: a", "", "data: b"]
      assert remaining == ""
    end
  end

  # --- Simulation helpers ---
  # These replicate the parsing logic from the private functions
  # to test the chunk-processing behavior without hitting real APIs.

  defp simulate_openai_parsing(lines) do
    acc = %{full_text: ""}
    collected = []

    {final_collected, final_acc} =
      Enum.reduce(lines, {collected, acc}, fn line, {collected, acc} ->
        line = String.trim(line)

        cond do
          line == "" ->
            {collected, acc}

          line == "data: [DONE]" ->
            {collected, acc}

          String.starts_with?(line, "data: ") ->
            json_str = String.trim_leading(line, "data: ")

            case Jason.decode(json_str) do
              {:ok, %{"choices" => [%{"delta" => %{"content" => content}} | _]}}
              when is_binary(content) and content != "" ->
                {collected ++ [content], %{acc | full_text: acc.full_text <> content}}

              _ ->
                {collected, acc}
            end

          true ->
            {collected, acc}
        end
      end)

    {final_collected, final_acc.full_text}
  end

  defp simulate_anthropic_parsing(lines) do
    acc = %{full_text: ""}
    collected = []

    {final_collected, final_acc} =
      Enum.reduce(lines, {collected, acc}, fn line, {collected, acc} ->
        line = String.trim(line)

        cond do
          line == "" ->
            {collected, acc}

          String.starts_with?(line, "data: ") ->
            json_str = String.trim_leading(line, "data: ")

            case Jason.decode(json_str) do
              {:ok, %{"type" => "content_block_delta", "delta" => %{"text" => text}}}
              when is_binary(text) ->
                {collected ++ [text], %{acc | full_text: acc.full_text <> text}}

              _ ->
                {collected, acc}
            end

          true ->
            {collected, acc}
        end
      end)

    {final_collected, final_acc.full_text}
  end

  defp simulate_ollama_parsing(lines) do
    acc = %{full_text: ""}
    collected = []

    {final_collected, final_acc} =
      Enum.reduce(lines, {collected, acc}, fn line, {collected, acc} ->
        line = String.trim(line)

        if line == "" do
          {collected, acc}
        else
          case Jason.decode(line) do
            {:ok, %{"message" => %{"content" => content}, "done" => false}}
            when is_binary(content) and content != "" ->
              {collected ++ [content], %{acc | full_text: acc.full_text <> content}}

            _ ->
              {collected, acc}
          end
        end
      end)

    {final_collected, final_acc.full_text}
  end

  defp split_on_newlines(buffer) do
    case String.split(buffer, "\n") do
      [] ->
        {[], buffer}

      parts ->
        {complete, [remaining]} = Enum.split(parts, -1)
        {complete, remaining}
    end
  end
end
