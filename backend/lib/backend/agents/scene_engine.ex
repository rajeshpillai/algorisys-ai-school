defmodule Backend.Agents.SceneEngine do
  @moduledoc """
  Designs structured learning scenes based on the orchestrator's decision.
  Defines the scene contract that teaching agents execute.
  """

  require Logger

  alias Backend.LLM.{Client, PromptBuilder}
  alias Backend.Classroom.LearnerState

  @model "gpt-4o-mini"

  @available_scene_types [
    "lecture",
    "discussion",
    "whiteboard",
    "exercise",
    "quiz",
    "recap",
    "simulation",
    "reflection"
  ]

  @available_skills [
    "explain_concept",
    "simplify_explanation",
    "compare_with_known_domain",
    "draw_whiteboard_steps",
    "generate_quiz",
    "grade_answer",
    "create_visual_analogy",
    "summarize_module"
  ]

  @doc """
  Design a scene for the given topic, agent, and action type.

  Returns {:ok, scene_spec} or {:error, reason}.
  """
  @spec design_scene(String.t(), map(), String.t(), %LearnerState{}) ::
          {:ok, map()} | {:error, term()}
  def design_scene(topic, selected_agent, action_type, learner_state, opts \\ []) do
    input = build_input(topic, selected_agent, action_type, learner_state)

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    with {:ok, prompt} <- PromptBuilder.load_prompt("scene-engine"),
         messages = PromptBuilder.build_scene_engine_messages(prompt, input),
         {:ok, scene_spec} <- Client.chat_json(messages, llm_opts) do
      Logger.info("Scene engine designed: #{inspect(scene_spec["scene"]["type"])}")
      {:ok, scene_spec}
    else
      {:error, reason} = err ->
        Logger.error("Scene engine failed: #{inspect(reason)}")
        err
    end
  end

  defp build_input(topic, selected_agent, action_type, learner_state) do
    %{
      topic: topic,
      subtopic: topic,
      learning_goal: topic,
      selected_agent: %{
        name: selected_agent["name"] || "Teacher",
        type: selected_agent["type"] || "teaching",
        purpose: selected_agent["purpose"] || "Teach the topic"
      },
      action_type: action_type,
      learner_state: %{
        understanding_score: learner_state.understanding_score,
        confidence: learner_state.confidence,
        preferred_style: learner_state.preferred_style,
        recent_errors: learner_state.recent_errors,
        time_remaining: learner_state.time_remaining || "unlimited"
      },
      available_scene_types: @available_scene_types,
      available_skills: @available_skills
    }
  end
end
