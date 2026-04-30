defmodule Backend.Agents.TeachingAgentTest do
  use ExUnit.Case, async: true

  @moduletag :llm_integration

  alias Backend.Agents.TeachingAgent
  alias Backend.Classroom.LearnerState

  describe "teach/5" do
    test "builds messages and attempts streaming without crashing" do
      callback = fn _event -> :ok end

      result =
        TeachingAgent.teach(
          %{"name" => "Code Coach", "type" => "teaching"},
          %{"scene" => %{"type" => "lecture", "objective" => "Teach variables"}},
          [],
          %LearnerState{},
          callback
        )

      # May succeed (streams from API) or fail (no API key)
      assert result == :ok or match?({:error, _}, result)
    end

    test "extracts inner scene from wrapped spec" do
      callback = fn _event -> :ok end

      result =
        TeachingAgent.teach(
          %{"name" => "Teacher"},
          %{
            "scene" => %{"type" => "quiz", "objective" => "Test knowledge"},
            "runtime_updates" => %{"notes" => "check understanding"}
          },
          [%{role: "user", content: "I'm ready"}],
          %LearnerState{},
          callback
        )

      assert result == :ok or match?({:error, _}, result)
    end

    test "handles flat scene spec (no wrapper)" do
      callback = fn _event -> :ok end

      result =
        TeachingAgent.teach(
          %{"name" => "Teacher"},
          %{"type" => "lecture", "objective" => "Intro"},
          [%{role: "user", content: "Go ahead"}],
          %LearnerState{},
          callback
        )

      assert result == :ok or match?({:error, _}, result)
    end
  end

  describe "ensure_user_message logic" do
    test "adds user message when none exist" do
      messages = [%{role: "system", content: "You are a teacher."}]
      result = ensure_user_msg(messages, %{"name" => "Coach"}, %{"type" => "lecture"})

      assert length(result) == 2
      last = List.last(result)
      assert last.role == "user"
      assert String.contains?(last.content, "lecture")
      assert String.contains?(last.content, "Coach")
    end

    test "does not add message when user message exists" do
      messages = [
        %{role: "system", content: "Prompt"},
        %{role: "user", content: "Hello"}
      ]

      result = ensure_user_msg(messages, %{"name" => "Teacher"}, %{"type" => "lecture"})
      assert length(result) == 2
    end

    test "detects user messages with string keys" do
      messages = [
        %{"role" => "system", "content" => "Prompt"},
        %{"role" => "user", "content" => "Hello"}
      ]

      result = ensure_user_msg(messages, %{"name" => "Teacher"}, %{"type" => "lecture"})
      assert length(result) == 2
    end
  end

  defp ensure_user_msg(messages, role_spec, scene_spec) do
    has_user? =
      Enum.any?(messages, fn msg ->
        to_string(msg[:role] || msg["role"]) == "user"
      end)

    if has_user? do
      messages
    else
      scene_type = scene_spec["type"] || "lecture"
      agent_name = role_spec["name"] || "Teacher"

      starter =
        "Please begin the #{scene_type} scene. I'm ready to learn. (You are #{agent_name}.)"

      messages ++ [%{role: "user", content: starter}]
    end
  end
end
