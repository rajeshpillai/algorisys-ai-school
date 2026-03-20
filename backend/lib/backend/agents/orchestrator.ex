defmodule Backend.Agents.Orchestrator do
  @moduledoc """
  Decides which agent acts next, what scene to use, and whether adaptation is needed.
  Acts as the conductor of the multi-agent learning session.
  """

  require Logger

  alias Backend.LLM.{Client, PromptBuilder}
  alias Backend.Classroom.LearnerState

  @model "gpt-4o-mini"

  @available_scenes [
    "lecture",
    "discussion",
    "whiteboard",
    "exercise",
    "quiz",
    "recap",
    "simulation",
    "reflection",
    "roundtable"
  ]

  @doc """
  Decide the next action given the current session state.

  `current_state` should include:
    - :current_topic
    - :current_scene
    - :agents (list of role specs)
    - :learner_state (%LearnerState{})
    - :last_interaction (map or nil)
    - :goal

  Returns {:ok, decision} or {:error, reason}.
  """
  @spec decide_next(map()) :: {:ok, map()} | {:error, term()}
  def decide_next(current_state, opts \\ []) do
    input = build_input(current_state)

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    with {:ok, prompt} <- PromptBuilder.load_prompt("orchestrator-agent"),
         messages = PromptBuilder.build_orchestrator_messages(prompt, input),
         {:ok, decision} <- Client.chat_json(messages, llm_opts) do
      Logger.info("Orchestrator decision: #{inspect(decision["next_action"])}")
      {:ok, decision}
    else
      {:error, reason} = err ->
        Logger.error("Orchestrator failed: #{inspect(reason)}")
        err
    end
  end

  defp build_input(state) do
    learner = state[:learner_state] || %LearnerState{}
    agents = state[:agents] || []

    available_agents =
      Enum.map(agents, fn agent ->
        %{
          name: agent["name"] || "Unknown",
          type: agent["type"] || "teaching",
          activation_conditions: agent["activation_conditions"] || []
        }
      end)

    last_interaction =
      case state[:last_interaction] do
        nil ->
          %{
            agent: "none",
            message_type: "none",
            summary: "Session just started. No prior interaction."
          }

        interaction ->
          interaction
      end

    %{
      current_topic: state[:current_topic] || state[:goal] || "unknown",
      current_scene: state[:current_scene] || "none",
      lesson_plan: build_lesson_plan(state),
      learner_state: %{
        understanding_score: learner.understanding_score,
        confidence: learner.confidence,
        fatigue: learner.fatigue,
        recent_errors: learner.recent_errors,
        time_remaining: learner.time_remaining || "unlimited",
        preferred_style: learner.preferred_style
      },
      last_interaction: last_interaction,
      available_agents: available_agents,
      available_scenes: @available_scenes
    }
  end

  defp build_lesson_plan(state) do
    case state[:curriculum_plan] do
      %{"modules" => modules} when is_list(modules) ->
        Enum.flat_map(modules, fn mod ->
          lessons = mod["lessons"] || []

          Enum.map(lessons, fn lesson ->
            %{
              module: mod["title"] || "Module",
              topic: lesson["title"] || lesson["concept"] || "Topic",
              estimated_minutes: lesson["estimated_minutes"],
              activity_types: lesson["activity_types"] || []
            }
          end)
        end)

      _ ->
        [state[:goal] || "Learn the topic"]
    end
  end
end
