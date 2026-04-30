defmodule Backend.Content.Schemas.SourceMaterial do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "source_materials" do
    field(:filename, :string)
    field(:content, :string)
    field(:summary, :string)
    field(:page_count, :integer)
    field(:char_count, :integer)

    timestamps()
  end

  def changeset(source, attrs) do
    source
    |> cast(attrs, [:filename, :content, :summary, :page_count, :char_count])
    |> validate_required([:filename, :content])
  end
end
