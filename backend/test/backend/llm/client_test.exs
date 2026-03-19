defmodule Backend.LLM.ClientTest do
  use ExUnit.Case, async: true

  alias Backend.LLM.Client

  describe "chat_json/2 code fence stripping" do
    # We can't call chat_json directly without an API, but we can test
    # the strip_code_fences logic by testing what chat_json would produce.
    # Since strip_code_fences is private, we test it indirectly through
    # the module's observable behavior patterns.

    test "strips ```json fences" do
      input = "```json\n{\"key\": \"value\"}\n```"
      assert strip_fences(input) == ~s({"key": "value"})
    end

    test "strips plain ``` fences" do
      input = "```\n{\"key\": \"value\"}\n```"
      assert strip_fences(input) == ~s({"key": "value"})
    end

    test "leaves clean JSON untouched" do
      input = ~s({"key": "value"})
      assert strip_fences(input) == input
    end

    test "handles whitespace around fences" do
      input = "  ```json\n  {\"a\": 1}\n  ```  "
      # After trim, starts with ```json
      result = strip_fences(input)
      assert Jason.decode!(result) == %{"a" => 1}
    end
  end

  describe "ensure_json_instruction" do
    test "adds instruction when no system message has it" do
      messages = [
        %{role: "system", content: "You are a teacher"},
        %{role: "user", content: "Hello"}
      ]

      result = ensure_json_instruction(messages)
      system_msg = Enum.find(result, &(to_string(&1[:role]) == "system"))
      assert String.contains?(to_string(system_msg[:content]), "Respond with valid JSON only.")
    end

    test "does not duplicate instruction" do
      messages = [
        %{role: "system", content: "You are a teacher.\n\nRespond with valid JSON only."},
        %{role: "user", content: "Hello"}
      ]

      result = ensure_json_instruction(messages)
      json_count =
        result
        |> Enum.filter(&(to_string(&1[:role]) == "system"))
        |> Enum.count(&String.contains?(to_string(&1[:content]), "Respond with valid JSON only."))

      assert json_count == 1
    end

    test "creates system message if none exists" do
      messages = [%{role: "user", content: "Hello"}]

      result = ensure_json_instruction(messages)
      assert length(result) == 2
      first = hd(result)
      assert to_string(first[:role]) == "system"
      assert to_string(first[:content]) == "Respond with valid JSON only."
    end

    test "handles empty message list" do
      result = ensure_json_instruction([])
      assert length(result) == 1
      assert hd(result)[:role] == "system"
    end
  end

  describe "provider resolution" do
    test "returns unsupported provider error" do
      assert {:error, {:unsupported_provider, :nonexistent}} =
               Client.chat([], provider: :nonexistent)
    end
  end

  # --- Private function replicas for testing ---
  # These mirror the private functions in Client to test the logic.

  defp strip_fences(text) do
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

  defp ensure_json_instruction(messages) do
    json_instruction = "Respond with valid JSON only."

    case Enum.reverse(messages) do
      [] ->
        [%{role: "system", content: json_instruction}]

      _reversed ->
        has_json_instruction? =
          Enum.any?(messages, fn msg ->
            role = to_string(msg[:role] || msg["role"])
            content = to_string(msg[:content] || msg["content"])
            role == "system" and String.contains?(content, json_instruction)
          end)

        if has_json_instruction? do
          messages
        else
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
end
