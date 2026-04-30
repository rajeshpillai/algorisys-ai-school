defmodule Backend.Classroom.Schemas.Message do
  use Ecto.Schema
  import Ecto.Changeset

  schema "messages" do
    belongs_to(:session, Backend.Classroom.Schemas.Session, type: :string)
    field(:role, :string)
    field(:content, :string)
    field(:agent_name, :string)
    field(:agent_role, :string)
    field(:position, :integer)

    timestamps(updated_at: false)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:session_id, :role, :content, :agent_name, :agent_role, :position])
    |> validate_required([:session_id, :role, :content, :position])
    |> validate_inclusion(:role, ~w(user assistant system))
  end
end
