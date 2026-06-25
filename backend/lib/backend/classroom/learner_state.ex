defmodule Backend.Classroom.LearnerState do
  @moduledoc """
  Tracks the learner's cognitive and progress state within a classroom session.
  Used by the orchestrator and teaching agents to adapt instruction.
  """

  defstruct understanding_score: 50,
            confidence: 50,
            fatigue: 0,
            known_concepts: [],
            misconceptions: [],
            preferred_style: "examples",
            time_remaining: nil,
            topics_completed: [],
            quiz_history: [],
            recent_errors: [],
            signals: %{},
            scaffold_level: "worked"

  @type t :: %__MODULE__{
          understanding_score: integer(),
          confidence: integer(),
          fatigue: integer(),
          known_concepts: list(String.t()),
          misconceptions: list(String.t()),
          preferred_style: String.t(),
          time_remaining: String.t() | nil,
          topics_completed: list(String.t()),
          quiz_history: list(map()),
          recent_errors: list(String.t()),
          signals: map(),
          scaffold_level: String.t()
        }

  @scaffold_levels ["worked", "faded", "independent"]

  @doc "Convert the learner state to a map suitable for JSON encoding."
  def to_map(%__MODULE__{} = state) do
    %{
      understanding_score: state.understanding_score,
      confidence: state.confidence,
      fatigue: state.fatigue,
      known_concepts: state.known_concepts,
      misconceptions: state.misconceptions,
      preferred_style: state.preferred_style,
      time_remaining: state.time_remaining,
      topics_completed: state.topics_completed,
      quiz_history: state.quiz_history,
      recent_errors: state.recent_errors,
      signals: state.signals,
      scaffold_level: state.scaffold_level
    }
  end

  @doc "Rebuild a LearnerState struct from a JSONB map (string keys)."
  def from_map(nil), do: %__MODULE__{}

  def from_map(map) when is_map(map) do
    %__MODULE__{
      understanding_score: map["understanding_score"] || 50,
      confidence: map["confidence"] || 50,
      fatigue: map["fatigue"] || 0,
      known_concepts: map["known_concepts"] || [],
      misconceptions: map["misconceptions"] || [],
      preferred_style: map["preferred_style"] || "examples",
      time_remaining: map["time_remaining"],
      topics_completed: map["topics_completed"] || [],
      quiz_history: map["quiz_history"] || [],
      recent_errors: map["recent_errors"] || [],
      signals: map["signals"] || %{},
      scaffold_level: map["scaffold_level"] || "worked"
    }
  end

  @doc """
  Merge a partial updates map (typically from LearnerModel LLM output) into the state.

  - Numeric scores are clamped to 0..100; missing or non-integer values are ignored.
  - `known_concepts` and `topics_completed` are union-merged (no duplicates, order preserved).
  - `misconceptions` and `recent_errors` are replaced wholesale (LLM produces the current view).
  - `quiz_history` is appended (LLM produces only the new entries).
  - Unknown keys are ignored.
  """
  @spec merge_updates(t(), map()) :: t()
  def merge_updates(%__MODULE__{} = state, updates) when is_map(updates) do
    state
    |> apply_score(updates, "understanding_score", :understanding_score)
    |> apply_score(updates, "confidence", :confidence)
    |> apply_score(updates, "fatigue", :fatigue)
    |> apply_string(updates, "preferred_style", :preferred_style)
    |> apply_string_or_nil(updates, "time_remaining", :time_remaining)
    |> apply_union(updates, "known_concepts", :known_concepts)
    |> apply_union(updates, "topics_completed", :topics_completed)
    |> apply_replace_list(updates, "misconceptions", :misconceptions)
    |> apply_replace_list(updates, "recent_errors", :recent_errors)
    |> apply_append_list(updates, "quiz_history", :quiz_history)
  end

  def merge_updates(%__MODULE__{} = state, _), do: state

  @doc """
  Step the `scaffold_level` fade based on the current `signals`.

  This is the deterministic "fade" — worked example (I do) → faded/completion
  example (we do) → independent problem (you do) — mirroring teachme's symmetric
  success/failure rules:

    - `mastery_detected` or `ready_to_advance` ⇒ advance one notch (show less).
    - `needs_remediation` or `needs_simplification` ⇒ revert one notch (show more).
    - otherwise unchanged.

  Revert wins if both an advance and a revert signal are set (failure shrinks the
  step). Levels clamp at the ends (`worked` ⇄ `independent`). Pure and idempotent
  per call.
  """
  @spec recalc_scaffold(t()) :: t()
  def recalc_scaffold(%__MODULE__{signals: signals, scaffold_level: level} = state)
      when is_map(signals) do
    %{state | scaffold_level: step_scaffold(level, signals)}
  end

  def recalc_scaffold(%__MODULE__{} = state), do: state

  defp step_scaffold(level, signals) do
    cond do
      signals["needs_remediation"] == true or signals["needs_simplification"] == true ->
        shift(level, -1)

      signals["mastery_detected"] == true or signals["ready_to_advance"] == true ->
        shift(level, +1)

      true ->
        level
    end
  end

  defp shift(level, delta) do
    idx = Enum.find_index(@scaffold_levels, &(&1 == level)) || 0
    new_idx = idx + delta
    Enum.at(@scaffold_levels, clamp_index(new_idx)) || level
  end

  defp clamp_index(i) when i < 0, do: 0
  defp clamp_index(i) when i > 2, do: 2
  defp clamp_index(i), do: i

  defp fetch(updates, key) do
    case Map.fetch(updates, key) do
      {:ok, value} -> {:ok, value}
      :error -> Map.fetch(updates, String.to_atom(key))
    end
  end

  defp apply_score(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, value} when is_integer(value) -> Map.put(state, field, clamp(value))
      _ -> state
    end
  end

  defp apply_string(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, value} when is_binary(value) and value != "" -> Map.put(state, field, value)
      _ -> state
    end
  end

  defp apply_string_or_nil(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, nil} -> Map.put(state, field, nil)
      {:ok, value} when is_binary(value) -> Map.put(state, field, value)
      _ -> state
    end
  end

  defp apply_union(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, list} when is_list(list) ->
        existing = Map.get(state, field)
        new_items = Enum.filter(list, &is_binary/1) -- existing
        Map.put(state, field, existing ++ new_items)

      _ ->
        state
    end
  end

  defp apply_replace_list(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, list} when is_list(list) ->
        Map.put(state, field, Enum.filter(list, &is_binary/1))

      _ ->
        state
    end
  end

  defp apply_append_list(state, updates, key, field) do
    case fetch(updates, key) do
      {:ok, list} when is_list(list) ->
        existing = Map.get(state, field)
        Map.put(state, field, existing ++ Enum.filter(list, &is_map/1))

      _ ->
        state
    end
  end

  defp clamp(n) when n < 0, do: 0
  defp clamp(n) when n > 100, do: 100
  defp clamp(n), do: n
end
