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
  def teach(role_spec, scene_spec, conversation_history, learner_state, callback, opts \\ []) do
    case PromptBuilder.load_prompt("teaching-agent") do
      {:ok, base_prompt} ->
        source_content = Keyword.get(opts, :source_content, "")

        messages =
          PromptBuilder.build_teaching_messages(
            base_prompt,
            role_spec,
            extract_scene(scene_spec),
            conversation_history,
            LearnerState.to_map(learner_state),
            source_content
          )

        # If there are no user messages in history, add a starter message
        messages = ensure_user_message(messages, role_spec, scene_spec)

        # Inject scene-specific output format reminder
        messages = inject_format_hint(messages, extract_scene(scene_spec))

        llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])
        Streaming.stream_chat(messages, callback, llm_opts)

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

  # Scene-type format hints — data-driven registry.
  # To add a new rich content type: add an entry here and update the teaching-agent prompt.
  @format_hints %{
    "whiteboard" => """
    IMPORTANT: This is a whiteboard scene. You MUST include at least one SVG diagram \
    wrapped in a ~~~whiteboard fenced block. Use simple SVG elements (rect, circle, line, \
    text, path) with viewBox="0 0 600 400". Do not skip the diagram. For multi-step \
    processes, generate multiple ~~~whiteboard blocks — they will be shown with slide-style \
    navigation. Leave whitespace so the learner can annotate with drawing tools.\
    """,
    "simulation" => """
    IMPORTANT: This is a simulation scene. You MUST include an interactive demo. You can either: \
    (1) Generate a self-contained HTML demo wrapped in a ~~~simulation fenced block (vanilla \
    JavaScript only, under 200 lines, inline styles), OR (2) Use a pre-built template with \
    ~~~simulation:template=NAME (available: bubble-sort, stack-queue, projectile-motion). \
    Use templates when they match the topic. Do not skip the interactive demo.\
    """,
    "lecture" => """
    IMPORTANT: This is a lecture scene. You SHOULD structure your explanation as a slide \
    presentation wrapped in a ~~~slides fenced block. Output a JSON array of slide objects, \
    each with "title" (string) and "body" (string, markdown with KaTeX formulas and code blocks). \
    Aim for 3-7 slides. Keep each slide focused on one idea. You may include conversational \
    text before and/or after the ~~~slides block.\
    """,
    "roundtable" => """
    IMPORTANT: This is a roundtable panel discussion. Other agents' contributions are in the \
    conversation history. Reference them BY NAME — agree, disagree, or build on their points. \
    Bring YOUR unique perspective. Keep it concise (2-4 paragraphs). Do NOT use slides, \
    whiteboard, or simulation blocks. Speak naturally as in a panel discussion.\
    """
  }

  defp inject_format_hint(messages, %{"type" => scene_type}) do
    case Map.get(@format_hints, scene_type) do
      nil -> messages
      hint -> messages ++ [%{role: "system", content: hint}]
    end
  end

  defp inject_format_hint(messages, _scene_spec), do: messages

  # Ensure there's at least one user message so the LLM has something to respond to.
  defp ensure_user_message(messages, _role_spec, _scene_spec) do
    has_user_msg? =
      Enum.any?(messages, fn msg ->
        to_string(msg[:role] || msg["role"]) == "user"
      end)

    if has_user_msg? do
      messages
    else
      messages ++ [%{role: "user", content: "Go ahead, teach me about this topic."}]
    end
  end
end
