defmodule Backend.Agents.RoleSynthesis do
  @moduledoc """
  Generates a dynamic team of AI agents for a learning session.
  Calls the role-synthesis LLM to design roles based on goal and learner profile.
  """

  require Logger

  alias Backend.LLM.{Client, PromptBuilder}

  @model "gpt-4o-mini"

  @default_learner_profile %{
    "background" => "general",
    "level" => "beginner",
    "known_concepts" => [],
    "learning_preferences" => ["examples"],
    "constraints" => %{
      "time_limit" => "none",
      "depth" => "standard",
      "pace" => "moderate"
    }
  }

  @doc """
  Generate a team of agent roles for the given learning goal and learner profile.

  Returns {:ok, roles} where roles is a list of role specification maps,
  or {:error, reason}.
  """
  @spec generate_team(String.t(), map() | nil) :: {:ok, list(map())} | {:error, term()}
  def generate_team(goal, learner_profile \\ nil) do
    profile = build_learner_profile(learner_profile)

    input = %{
      goal: goal,
      topic: goal,
      learner_profile: profile
    }

    with {:ok, prompt} <- PromptBuilder.load_prompt("role-synthesis-agent"),
         messages = PromptBuilder.build_role_synthesis_messages(prompt, input),
         {:ok, roles} when is_list(roles) <- Client.chat_json(messages, model: @model) do
      Logger.info("Role synthesis generated #{length(roles)} roles for goal: #{goal}")
      {:ok, roles}
    else
      {:ok, result} when is_map(result) ->
        # Sometimes the LLM wraps the array in a key
        roles = result["roles"] || result["agents"] || result["team"] || [result]
        {:ok, roles}

      {:error, reason} = err ->
        Logger.error("Role synthesis failed: #{inspect(reason)}")
        err
    end
  end

  defp build_learner_profile(nil), do: @default_learner_profile

  defp build_learner_profile(profile) when is_binary(profile) do
    %{@default_learner_profile | "background" => profile}
  end

  defp build_learner_profile(profile) when is_map(profile) do
    %{
      "background" => profile["background"] || @default_learner_profile["background"],
      "level" => profile["level"] || @default_learner_profile["level"],
      "known_concepts" => profile["known_concepts"] || @default_learner_profile["known_concepts"],
      "learning_preferences" =>
        profile["learning_preferences"] || @default_learner_profile["learning_preferences"],
      "constraints" =>
        Map.merge(
          @default_learner_profile["constraints"],
          profile["constraints"] || %{}
        )
    }
  end
end
