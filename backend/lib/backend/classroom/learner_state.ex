defmodule Backend.Classroom.LearnerState do
  @moduledoc """
  Tracks the learner's progress and state within a classroom session.
  """

  defstruct [
    :session_id,
    :course_id,
    :lesson_id,
    :current_activity,
    :started_at,
    messages: [],
    progress: %{}
  ]

  @type t :: %__MODULE__{
          session_id: String.t() | nil,
          course_id: String.t() | nil,
          lesson_id: String.t() | nil,
          current_activity: String.t() | nil,
          started_at: DateTime.t() | nil,
          messages: list(),
          progress: map()
        }
end
