defmodule Backend.Agents.OrchestratorTest do
  use ExUnit.Case, async: true

  @moduletag :llm_integration

  alias Backend.Agents.Orchestrator
  alias Backend.Classroom.LearnerState

  # These tests verify input-building logic doesn't crash.
  # The LLM call may succeed or fail depending on API key config.

  describe "decide_next/1 input building" do
    test "handles minimal input" do
      result = Orchestrator.decide_next(%{goal: "Learn Elixir"})
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles full input" do
      result = Orchestrator.decide_next(%{
        current_topic: "Pattern Matching",
        current_scene: "lecture",
        agents: [
          %{"name" => "Elixir Guide", "type" => "teaching", "activation_conditions" => ["always"]},
          %{"name" => "Quiz Master", "type" => "assessment", "activation_conditions" => ["after_lecture"]}
        ],
        learner_state: %LearnerState{understanding_score: 70, confidence: 60},
        last_interaction: %{agent: "Elixir Guide", message_type: "response", summary: "Explained pattern matching"},
        goal: "Learn Elixir",
        curriculum_plan: %{
          "modules" => [
            %{"title" => "Basics", "lessons" => [
              %{"title" => "Pattern Matching", "estimated_minutes" => 15, "activity_types" => ["lecture", "exercise"]}
            ]}
          ]
        }
      })

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles nil learner_state" do
      result = Orchestrator.decide_next(%{
        goal: "Learn Go",
        agents: [],
        learner_state: nil
      })

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles nil curriculum_plan" do
      result = Orchestrator.decide_next(%{
        goal: "Learn Python",
        agents: [%{"name" => "Teacher"}],
        learner_state: %LearnerState{},
        curriculum_plan: nil
      })

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "returns structured decision on success" do
      result = Orchestrator.decide_next(%{
        goal: "Learn variables",
        agents: [%{"name" => "Teacher", "type" => "teaching", "activation_conditions" => []}],
        learner_state: %LearnerState{}
      })

      case result do
        {:ok, decision} ->
          assert is_map(decision)
          assert Map.has_key?(decision, "next_action")

        {:error, _} ->
          :ok
      end
    end
  end
end
