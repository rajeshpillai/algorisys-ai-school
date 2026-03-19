defmodule Backend.Content.Course do
  @moduledoc """
  Represents a course with its metadata and module structure.
  """

  defstruct [
    :id,
    :subject,
    :title,
    :description,
    :language,
    modules: []
  ]

  @type t :: %__MODULE__{
          id: String.t() | nil,
          subject: String.t() | nil,
          title: String.t() | nil,
          description: String.t() | nil,
          language: String.t() | nil,
          modules: list()
        }
end
