defmodule Backend.Agents.CurriculumPlanner do
  @moduledoc """
  Generates a structured, time-aware curriculum plan from a learning goal.
  Called once at session start, before the orchestrator.
  """

  require Logger

  alias Backend.LLM.{Client, PromptBuilder}

  @model "gpt-4o-mini"

  @doc """
  Generate a curriculum plan for the given goal and learner profile.

  Returns {:ok, plan} or {:error, reason}.
  The plan includes modules, lessons, time budgets, checkpoints, and adaptation notes.
  """
  @spec generate_plan(String.t(), any()) :: {:ok, map()} | {:error, term()}
  def generate_plan(goal, learner_profile, opts \\ []) do
    source_summary = Keyword.get(opts, :source_summary)
    input = build_input(goal, learner_profile, source_summary)

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    with {:ok, prompt} <- PromptBuilder.load_prompt("curriculum-planner"),
         messages = PromptBuilder.build_curriculum_planner_messages(prompt, input),
         {:ok, result} <- Client.chat_json(messages, llm_opts) do
      plan = extract_plan(result)
      Logger.info("Curriculum plan generated: #{length(plan["modules"] || [])} modules")
      {:ok, plan}
    else
      {:error, reason} = err ->
        Logger.error("Curriculum planner failed: #{inspect(reason)}")
        err
    end
  end

  defp build_input(goal, learner_profile, source_summary) do
    profile =
      case learner_profile do
        nil ->
          %{
            background: "unknown",
            level: "beginner",
            known_concepts: [],
            learning_preferences: %{style: "examples", pace: "moderate"},
            constraints: %{}
          }

        p when is_map(p) ->
          p

        p when is_binary(p) ->
          %{
            background: p,
            level: "beginner",
            known_concepts: [],
            learning_preferences: %{style: "examples", pace: "moderate"},
            constraints: %{}
          }
      end

    # Extract time constraint from goal if present (e.g. "in 6 hours")
    time_constraint = extract_time_constraint(goal)

    profile =
      if time_constraint do
        Map.put(profile, :constraints, Map.merge(profile[:constraints] || %{}, %{total_time_minutes: time_constraint}))
      else
        profile
      end

    input = %{
      goal: goal,
      topic: goal,
      learner_profile: profile
    }

    # When source material is attached, include it so the curriculum
    # is grounded in the actual document content
    if source_summary do
      Map.put(input, :source_material_summary, source_summary)
    else
      input
    end
  end

  defp extract_time_constraint(goal) do
    cond do
      Regex.match?(~r/(\d+)\s*hours?/i, goal) ->
        [_, hours] = Regex.run(~r/(\d+)\s*hours?/i, goal)
        String.to_integer(hours) * 60

      Regex.match?(~r/(\d+)\s*minutes?/i, goal) ->
        [_, minutes] = Regex.run(~r/(\d+)\s*minutes?/i, goal)
        String.to_integer(minutes)

      true ->
        nil
    end
  end

  defp extract_plan(%{"plan" => plan}) when is_map(plan), do: plan
  defp extract_plan(result) when is_map(result), do: result
end
