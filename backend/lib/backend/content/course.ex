defmodule Backend.Content.Course do
  @moduledoc "Represents a course with its modules and metadata"

  @derive {Jason.Encoder, only: [:id, :subject, :title, :description, :language, :modules]}
  defstruct [:id, :subject, :title, :description, :language, modules: []]

  @type t :: %__MODULE__{
          id: String.t() | nil,
          subject: String.t() | nil,
          title: String.t() | nil,
          description: String.t() | nil,
          language: String.t() | nil,
          modules: list()
        }

  defmodule Module do
    @derive {Jason.Encoder, only: [:id, :title, :sequence, :lessons]}
    defstruct [:id, :title, :sequence, lessons: []]
  end

  defmodule LessonSummary do
    @derive {Jason.Encoder,
             only: [:id, :title, :sequence, :difficulty, :estimated_minutes, :activity_types]}
    defstruct [:id, :title, :sequence, :difficulty, :estimated_minutes, :activity_types]
  end
end
