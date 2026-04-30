defmodule Backend.Agents.LearnerModel do
  @moduledoc """
  Evaluates learner state after a teaching turn.

  Calls the `learner-model` LLM with the prior state plus recent interactions and
  returns an updated `LearnerState`. The LLM also produces signals and
  recommendations; those are logged for now and not surfaced through the return
  type (the plan reserves richer outputs for a follow-up).
  """

  require Logger

  alias Backend.Classroom.LearnerState
  alias Backend.LLM.{Client, PromptBuilder}

  @model "gpt-4o-mini"
  @recent_message_window 6

  @doc """
  Evaluate the learner's current state given recent interactions.

  Returns an updated `LearnerState` struct. On LLM failure or invalid output,
  returns `{:error, reason}` and the caller should keep the prior state.
  """
  @spec evaluate(LearnerState.t(), list(map()), String.t() | nil, map() | nil, keyword()) ::
          {:ok, LearnerState.t()} | {:error, term()}
  def evaluate(
        prior_state,
        recent_messages,
        current_topic \\ nil,
        learner_profile \\ nil,
        opts \\ []
      )

  def evaluate(
        %LearnerState{} = prior_state,
        recent_messages,
        current_topic,
        learner_profile,
        opts
      )
      when is_list(recent_messages) do
    input = %{
      current_state: LearnerState.to_map(prior_state),
      recent_interactions: format_interactions(recent_messages),
      current_topic: current_topic,
      learner_profile: learner_profile
    }

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    with {:ok, prompt} <- PromptBuilder.load_prompt("learner-model"),
         messages = PromptBuilder.build_learner_model_messages(prompt, input),
         {:ok, response} when is_map(response) <- Client.chat_json(messages, llm_opts) do
      apply_response(prior_state, response, current_topic)
    else
      {:ok, other} ->
        Logger.error("LearnerModel returned non-map response: #{inspect(other)}")
        {:error, :invalid_response}

      {:error, reason} = err ->
        Logger.error("LearnerModel evaluation failed: #{inspect(reason)}")
        err
    end
  end

  @doc """
  Merge a parsed LLM response into the prior learner state.

  Public to allow unit testing the parsing/merging logic without an LLM call.
  """
  @spec apply_response(LearnerState.t(), map(), String.t() | nil) ::
          {:ok, LearnerState.t()} | {:error, term()}
  def apply_response(%LearnerState{} = prior_state, response, current_topic \\ nil)
      when is_map(response) do
    log_signals(response, current_topic)

    case fetch_state(response) do
      {:ok, updates} when is_map(updates) ->
        normalized = normalize_updates(updates)
        {:ok, LearnerState.merge_updates(prior_state, normalized)}

      {:ok, other} ->
        Logger.error("LearnerModel learner_state is not a map: #{inspect(other)}")
        {:error, :invalid_response}

      :error ->
        Logger.error("LearnerModel response missing learner_state key: #{inspect(response)}")
        {:error, :invalid_response}
    end
  end

  defp fetch_state(response) do
    cond do
      Map.has_key?(response, "learner_state") -> {:ok, Map.get(response, "learner_state")}
      Map.has_key?(response, :learner_state) -> {:ok, Map.get(response, :learner_state)}
      true -> :error
    end
  end

  defp normalize_updates(updates) do
    updates
    |> Map.new(fn {k, v} -> {to_string(k), v} end)
    |> Map.update("misconceptions", nil, &normalize_misconceptions/1)
  end

  defp normalize_misconceptions(nil), do: nil

  defp normalize_misconceptions(items) when is_list(items),
    do: Enum.map(items, &misconception_to_string/1)

  defp normalize_misconceptions(_), do: []

  defp misconception_to_string(item) when is_binary(item), do: item

  defp misconception_to_string(%{} = item) do
    concept = item["concept"] || item[:concept] || ""
    belief = item["incorrect_belief"] || item[:incorrect_belief] || ""
    severity = item["severity"] || item[:severity]

    base =
      case {String.trim(to_string(concept)), String.trim(to_string(belief))} do
        {"", b} -> b
        {c, ""} -> c
        {c, b} -> "#{c}: #{b}"
      end

    if severity in ["blocking", :blocking], do: "[blocking] #{base}", else: base
  end

  defp misconception_to_string(other), do: to_string(other)

  defp format_interactions(messages) do
    messages
    |> Enum.take(-@recent_message_window)
    |> Enum.map(fn
      %{role: role, content: content} -> %{role: role, content: content}
      %{"role" => role, "content" => content} -> %{role: role, content: content}
      other -> other
    end)
  end

  defp log_signals(response, current_topic) do
    signals = response["signals"] || response[:signals]
    reasoning = response["reasoning"] || response[:reasoning]

    if is_map(signals) do
      flagged =
        signals
        |> Enum.filter(fn {_k, v} -> v == true end)
        |> Enum.map(&elem(&1, 0))

      if flagged != [] do
        Logger.info(
          "LearnerModel signals#{if current_topic, do: " (topic=#{current_topic})", else: ""}: #{Enum.join(flagged, ", ")}"
        )
      end
    end

    if is_binary(reasoning) and reasoning != "" do
      Logger.debug("LearnerModel reasoning: #{reasoning}")
    end
  end
end
