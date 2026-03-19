defmodule Backend.Content.Lesson do
  @moduledoc "Represents a full lesson with all content sections"

  @derive {Jason.Encoder,
           only: [
             :id,
             :module,
             :sequence,
             :title,
             :difficulty,
             :estimated_minutes,
             :activity_types,
             :slide_content,
             :discussion_prompt,
             :quiz_content,
             :playground_code,
             :playground_solution
           ]}
  defstruct [
    :id,
    :module,
    :sequence,
    :title,
    :difficulty,
    :estimated_minutes,
    :activity_types,
    :slide_content,
    :discussion_prompt,
    :quiz_content,
    :playground_code,
    :playground_solution
  ]

  @type t :: %__MODULE__{
          id: String.t() | nil,
          module: String.t() | nil,
          sequence: integer() | nil,
          title: String.t() | nil,
          activity_types: list() | nil,
          difficulty: String.t() | nil,
          estimated_minutes: integer() | nil,
          slide_content: String.t() | nil,
          discussion_prompt: String.t() | nil,
          quiz_content: String.t() | nil,
          playground_code: String.t() | nil,
          playground_solution: String.t() | nil
        }
end
