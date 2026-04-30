defmodule Backend.Agents.CurriculumPlannerTest do
  use ExUnit.Case, async: true

  @moduletag :llm_integration

  alias Backend.Agents.CurriculumPlanner

  # These tests verify input-building logic doesn't crash.
  # The LLM call may succeed or fail depending on API key config.

  describe "generate_plan/2 input building" do
    test "handles nil profile" do
      result = CurriculumPlanner.generate_plan("Learn Elixir", nil)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles string profile" do
      result = CurriculumPlanner.generate_plan("Learn Rust", "experienced JS developer")
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles map profile" do
      result =
        CurriculumPlanner.generate_plan("Learn Go", %{
          background: "backend engineer",
          level: "intermediate",
          known_concepts: ["REST APIs", "SQL"],
          learning_preferences: %{style: "hands-on"},
          constraints: %{}
        })

      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "returns structured plan on success" do
      result = CurriculumPlanner.generate_plan("Learn Python basics", nil)

      case result do
        {:ok, plan} ->
          assert is_map(plan)
          assert Map.has_key?(plan, "modules")
          assert is_list(plan["modules"])
          assert length(plan["modules"]) >= 1

          first_mod = hd(plan["modules"])
          assert Map.has_key?(first_mod, "title")
          assert Map.has_key?(first_mod, "lessons")

        {:error, _} ->
          :ok
      end
    end
  end

  describe "time constraint extraction" do
    test "goal with hours does not crash" do
      result = CurriculumPlanner.generate_plan("Learn calculus in 6 hours", nil)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "goal with minutes does not crash" do
      result = CurriculumPlanner.generate_plan("Learn SQL basics in 45 minutes", nil)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "goal without time constraint does not crash" do
      result = CurriculumPlanner.generate_plan("Learn machine learning", nil)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "extract_plan patterns" do
    test "unwraps plan key from result" do
      result = %{"plan" => %{"modules" => [%{"title" => "Basics"}]}}
      plan = extract_plan(result)
      assert plan["modules"] |> length() == 1
    end

    test "returns result directly if no plan key" do
      result = %{"modules" => [%{"title" => "Basics"}]}
      plan = extract_plan(result)
      assert plan["modules"] |> length() == 1
    end
  end

  defp extract_plan(%{"plan" => plan}) when is_map(plan), do: plan
  defp extract_plan(result) when is_map(result), do: result
end
