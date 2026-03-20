defmodule Backend.Repo.Migrations.CreateSourceMaterials do
  use Ecto.Migration

  def change do
    create table(:source_materials, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :filename, :string, null: false
      add :content, :text, null: false
      add :summary, :text
      add :page_count, :integer
      add :char_count, :integer

      timestamps()
    end
  end
end
