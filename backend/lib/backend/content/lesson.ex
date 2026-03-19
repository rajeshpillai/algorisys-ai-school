defmodule Backend.Content.Lesson do
  @moduledoc """
  Represents a single lesson within a course module.
  """

  defstruct [
    :id,
    :module,
    :sequence,
    :title,
    :difficulty,
    :estimated_minutes,
    :slide_content,
    :discussion_prompt,
    :quiz_content,
    :playground_code,
    :playground_solution,
    activity_types: []
  ]

  @type t :: %__MODULE__{
          id: String.t() | nil,
          module: String.t() | nil,
          sequence: integer() | nil,
          title: String.t() | nil,
          activity_types: list(),
          difficulty: String.t() | nil,
          estimated_minutes: integer() | nil,
          slide_content: String.t() | nil,
          discussion_prompt: String.t() | nil,
          quiz_content: map() | nil,
          playground_code: String.t() | nil,
          playground_solution: String.t() | nil
        }
end
