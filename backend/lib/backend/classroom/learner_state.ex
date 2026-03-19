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
            recent_errors: []

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
          recent_errors: list(String.t())
        }

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
      recent_errors: state.recent_errors
    }
  end
end
