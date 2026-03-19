defmodule Backend.LLM.PromptBuilderTest do
  use ExUnit.Case, async: true

  alias Backend.LLM.PromptBuilder

  describe "build_messages/2" do
    test "creates system message followed by context" do
      messages = PromptBuilder.build_messages("You are a teacher", [
        %{role: "user", content: "Hello"},
        %{role: "assistant", content: "Hi there!"}
      ])

      assert length(messages) == 3
      assert hd(messages) == %{role: "system", content: "You are a teacher"}
      assert Enum.at(messages, 1) == %{role: "user", content: "Hello"}
      assert Enum.at(messages, 2) == %{role: "assistant", content: "Hi there!"}
    end

    test "works with empty context" do
      messages = PromptBuilder.build_messages("System prompt")
      assert messages == [%{role: "system", content: "System prompt"}]
    end

    test "normalizes string-keyed messages" do
      messages = PromptBuilder.build_messages("Prompt", [
        %{"role" => "user", "content" => "Hello"}
      ])

      assert Enum.at(messages, 1) == %{role: "user", content: "Hello"}
    end
  end

  describe "build_orchestrator_messages/2" do
    test "creates system + JSON-encoded user message" do
      input = %{agents: ["A", "B"], topic: "math"}
      messages = PromptBuilder.build_orchestrator_messages("Orchestrate.", input)

      assert length(messages) == 2
      assert hd(messages).role == "system"
      assert hd(messages).content == "Orchestrate."

      user_msg = Enum.at(messages, 1)
      assert user_msg.role == "user"
      assert Jason.decode!(user_msg.content) == %{"agents" => ["A", "B"], "topic" => "math"}
    end
  end

  describe "build_role_synthesis_messages/2" do
    test "creates system + JSON-encoded user message" do
      input = %{goal: "Learn Rust", profile: "JS dev"}
      messages = PromptBuilder.build_role_synthesis_messages("Synthesize roles.", input)

      assert length(messages) == 2
      assert hd(messages).content == "Synthesize roles."
      decoded = Jason.decode!(Enum.at(messages, 1).content)
      assert decoded["goal"] == "Learn Rust"
    end
  end

  describe "build_curriculum_planner_messages/2" do
    test "creates system + JSON-encoded user message" do
      input = %{goal: "Learn calculus", hours: 6}
      messages = PromptBuilder.build_curriculum_planner_messages("Plan curriculum.", input)

      assert length(messages) == 2
      decoded = Jason.decode!(Enum.at(messages, 1).content)
      assert decoded["goal"] == "Learn calculus"
      assert decoded["hours"] == 6
    end
  end

  describe "build_scene_engine_messages/2" do
    test "creates system + JSON-encoded user message" do
      input = %{topic: "loops", scene_type: "quiz"}
      messages = PromptBuilder.build_scene_engine_messages("Design scene.", input)

      assert length(messages) == 2
      decoded = Jason.decode!(Enum.at(messages, 1).content)
      assert decoded["topic"] == "loops"
    end
  end

  describe "build_teaching_messages/5" do
    test "combines prompt with role, scene, and learner state" do
      role_spec = %{"name" => "Code Coach", "type" => "teaching"}
      scene_spec = %{"scene" => %{"type" => "lecture"}}
      learner_state = %{"understanding_score" => 60}
      history = [
        %{role: "user", content: "Explain loops"},
        %{role: "assistant", content: "Loops repeat code..."}
      ]

      messages = PromptBuilder.build_teaching_messages(
        "You are a teaching agent.",
        role_spec,
        scene_spec,
        history,
        learner_state
      )

      # System message + 2 history messages
      assert length(messages) == 3

      system = hd(messages)
      assert system.role == "system"
      assert String.contains?(system.content, "You are a teaching agent.")
      assert String.contains?(system.content, "Active Role Specification")
      assert String.contains?(system.content, "Code Coach")
      assert String.contains?(system.content, "Active Scene Specification")
      assert String.contains?(system.content, "lecture")
      assert String.contains?(system.content, "Current Learner State")
      assert String.contains?(system.content, "understanding_score")
    end

    test "works with empty conversation history" do
      messages = PromptBuilder.build_teaching_messages(
        "Teach.",
        %{"name" => "Teacher"},
        %{"scene" => %{}},
        [],
        %{"score" => 50}
      )

      assert length(messages) == 1
      assert hd(messages).role == "system"
    end
  end

  describe "load_prompt/1" do
    test "loads an existing system prompt" do
      assert {:ok, content} = PromptBuilder.load_prompt("orchestrator-agent")
      assert is_binary(content)
      assert String.length(content) > 0
    end

    test "returns error for nonexistent prompt" do
      assert {:error, :not_found} = PromptBuilder.load_prompt("nonexistent-prompt")
    end

    test "caches prompts on repeated loads" do
      # First load
      {:ok, content1} = PromptBuilder.load_prompt("teaching-agent")
      # Second load (from cache)
      {:ok, content2} = PromptBuilder.load_prompt("teaching-agent")
      assert content1 == content2
    end
  end
end
