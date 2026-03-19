defmodule Backend.LLM.PromptBuilder do
  @moduledoc """
  Loads system prompts from disk and builds message arrays for LLM calls.

  Prompts are loaded from the `system-prompts/` directory at the project root
  and cached in an ETS table for performance.
  """

  require Logger

  @prompts_table :prompt_cache

  @doc """
  Load a system prompt by name (without the .md extension).

  Reads from the system-prompts directory and caches the result in ETS.

  ## Examples

      iex> Backend.LLM.PromptBuilder.load_prompt("orchestrator-agent")
      {:ok, "You are the orchestrator agent..."}

  """
  @spec load_prompt(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def load_prompt(prompt_name) do
    ensure_table()

    case :ets.lookup(@prompts_table, prompt_name) do
      [{^prompt_name, content}] ->
        {:ok, content}

      [] ->
        path = prompt_path(prompt_name)

        case File.read(path) do
          {:ok, content} ->
            :ets.insert(@prompts_table, {prompt_name, content})
            {:ok, content}

          {:error, _reason} ->
            Logger.warning("Prompt file not found: #{path}")
            {:error, :not_found}
        end
    end
  end

  @doc """
  Build a messages array from a system prompt and optional conversation context.

  Returns a list of message maps suitable for `Backend.LLM.Client.chat/2`.
  """
  @spec build_messages(String.t(), list(map())) :: list(map())
  def build_messages(system_prompt, context \\ []) do
    system_msg = %{role: "system", content: system_prompt}
    [system_msg | normalize_messages(context)]
  end

  @doc """
  Build messages for the orchestrator agent.

  The orchestrator receives a system prompt and structured input data
  (encoded as JSON) as the user message.
  """
  @spec build_orchestrator_messages(String.t(), map()) :: list(map())
  def build_orchestrator_messages(orchestrator_prompt, input_data) do
    user_content = Jason.encode!(input_data, pretty: true)

    [
      %{role: "system", content: orchestrator_prompt},
      %{role: "user", content: user_content}
    ]
  end

  @doc """
  Build messages for the role synthesis agent.

  Similar to orchestrator but tailored for role synthesis workflows.
  """
  @spec build_role_synthesis_messages(String.t(), map()) :: list(map())
  def build_role_synthesis_messages(role_synthesis_prompt, input_data) do
    user_content = Jason.encode!(input_data, pretty: true)

    [
      %{role: "system", content: role_synthesis_prompt},
      %{role: "user", content: user_content}
    ]
  end

  @doc """
  Build messages for the scene engine agent.
  """
  @spec build_scene_engine_messages(String.t(), map()) :: list(map())
  def build_scene_engine_messages(scene_engine_prompt, input_data) do
    user_content = Jason.encode!(input_data, pretty: true)

    [
      %{role: "system", content: scene_engine_prompt},
      %{role: "user", content: user_content}
    ]
  end

  @doc """
  Build messages for the teaching agent.

  Combines the teaching agent system prompt template with the specific
  role spec and scene spec, then adds conversation history and learner state.

  The system prompt is constructed by appending the role and scene specifications
  as JSON blocks to the base teaching prompt.
  """
  @spec build_teaching_messages(
          String.t(),
          map(),
          map(),
          list(map()),
          map()
        ) :: list(map())
  def build_teaching_messages(
        teaching_prompt,
        role_spec,
        scene_spec,
        conversation_history,
        learner_state
      ) do
    system_prompt =
      teaching_prompt <>
        "\n\n## Active Role Specification\n```json\n" <>
        Jason.encode!(role_spec, pretty: true) <>
        "\n```\n\n## Active Scene Specification\n```json\n" <>
        Jason.encode!(scene_spec, pretty: true) <>
        "\n```\n\n## Current Learner State\n```json\n" <>
        Jason.encode!(learner_state, pretty: true) <>
        "\n```"

    system_msg = %{role: "system", content: system_prompt}
    history = normalize_messages(conversation_history)

    [system_msg | history]
  end

  # --- Private helpers ---

  defp prompt_path(prompt_name) do
    prompts_dir = Application.get_env(:backend, :prompts_dir, default_prompts_dir())
    Path.join(prompts_dir, "#{prompt_name}.md")
  end

  defp default_prompts_dir do
    # The system-prompts directory is at the project root, two levels up from
    # the backend app directory.
    Application.app_dir(:backend)
    |> Path.join("../../../system-prompts")
    |> Path.expand()
  end

  defp ensure_table do
    case :ets.whereis(@prompts_table) do
      :undefined ->
        :ets.new(@prompts_table, [:set, :public, :named_table, read_concurrency: true])

      _ref ->
        :ok
    end
  rescue
    ArgumentError ->
      # Table already exists (race condition with another process)
      :ok
  end

  defp normalize_messages(messages) do
    Enum.map(messages, fn msg ->
      %{
        role: to_string(msg[:role] || msg["role"]),
        content: to_string(msg[:content] || msg["content"])
      }
    end)
  end
end
