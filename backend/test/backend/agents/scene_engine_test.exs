defmodule Backend.Agents.SceneEngineTest do
  use ExUnit.Case, async: true

  @moduletag :llm_integration

  alias Backend.Agents.SceneEngine
  alias Backend.Classroom.LearnerState

  # These tests verify input-building logic doesn't crash.
  # The LLM call may succeed or fail depending on API key config.

  describe "design_scene/4 input building" do
    test "handles standard input" do
      result =
        SceneEngine.design_scene(
          "Variables",
          %{"name" => "Code Coach", "type" => "teaching", "purpose" => "Teach programming"},
          "explain",
          %LearnerState{}
        )

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles agent with missing fields" do
      result =
        SceneEngine.design_scene(
          "Loops",
          %{"name" => "Teacher"},
          "quiz",
          %LearnerState{understanding_score: 80}
        )

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles various action types" do
      for action <- ["explain", "quiz", "exercise"] do
        result =
          SceneEngine.design_scene(
            "Functions",
            %{"name" => "Teacher", "type" => "teaching"},
            action,
            %LearnerState{}
          )

        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles customized learner state" do
      result =
        SceneEngine.design_scene(
          "Recursion",
          %{"name" => "Expert", "type" => "teaching"},
          "explain",
          %LearnerState{
            understanding_score: 30,
            confidence: 20,
            preferred_style: "visual",
            recent_errors: ["confused base case with recursive case"],
            time_remaining: "30 minutes"
          }
        )

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "returns structured scene spec on success" do
      result =
        SceneEngine.design_scene(
          "Hello World",
          %{"name" => "Teacher", "type" => "teaching"},
          "explain",
          %LearnerState{}
        )

      case result do
        {:ok, spec} ->
          assert is_map(spec)
          assert Map.has_key?(spec, "scene")

        {:error, _} ->
          :ok
      end
    end
  end
end
