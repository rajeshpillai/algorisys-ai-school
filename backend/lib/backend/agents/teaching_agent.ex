defmodule Backend.Agents.TeachingAgent do
  @moduledoc """
  Executes scenes and delivers educational content to learners via streaming.
  The teaching agent adopts a dynamically assigned role and follows a scene contract.
  """

  require Logger

  alias Backend.LLM.{PromptBuilder, Streaming}
  alias Backend.Classroom.LearnerState

  @model "gpt-4o"

  @doc """
  Teach by executing the given scene with the assigned role.

  Streams the response, calling `callback` with:
    - `{:chunk, text}` for each streamed chunk
    - `{:done, full_text}` when streaming completes
    - `{:error, reason}` on failure

  `role_spec` is the agent role map from role synthesis.
  `scene_spec` is the scene map from the scene engine.
  `conversation_history` is a list of `%{role: ..., content: ...}` maps.
  `learner_state` is a `%LearnerState{}`.

  Returns :ok or {:error, reason}.
  """
  @spec teach(map(), map(), list(map()), %LearnerState{}, function()) ::
          :ok | {:error, term()}
  def teach(role_spec, scene_spec, conversation_history, learner_state, callback) do
    case PromptBuilder.load_prompt("teaching-agent") do
      {:ok, base_prompt} ->
        messages =
          PromptBuilder.build_teaching_messages(
            base_prompt,
            role_spec,
            extract_scene(scene_spec),
            conversation_history,
            LearnerState.to_map(learner_state)
          )

        # If there are no user messages in history, add a starter message
        messages = ensure_user_message(messages, role_spec, scene_spec)

        Streaming.stream_chat(messages, callback, model: @model)

      {:error, reason} ->
        Logger.error("Failed to load teaching-agent prompt: #{inspect(reason)}")
        callback.({:error, reason})
        {:error, reason}
    end
  end

  # The scene engine returns %{"scene" => ..., "runtime_updates" => ...}
  # We want the inner "scene" map for the teaching prompt.
  defp extract_scene(%{"scene" => scene}), do: scene
  defp extract_scene(scene), do: scene

  # Ensure there's at least one user message so the LLM has something to respond to.
  defp ensure_user_message(messages, role_spec, scene_spec) do
    has_user_msg? =
      Enum.any?(messages, fn msg ->
        to_string(msg[:role] || msg["role"]) == "user"
      end)

    if has_user_msg? do
      messages
    else
      scene = extract_scene(scene_spec)
      scene_type = scene["type"] || "lecture"
      agent_name = role_spec["name"] || "Teacher"

      starter =
        "Please begin the #{scene_type} scene. I'm ready to learn. " <>
          "(You are #{agent_name}.)"

      messages ++ [%{role: "user", content: starter}]
    end
  end
end
