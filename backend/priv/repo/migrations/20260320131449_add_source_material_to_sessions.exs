defmodule Backend.Repo.Migrations.AddSourceMaterialToSessions do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add :source_material_id, references(:source_materials, type: :uuid, on_delete: :nilify_all)
    end
  end
end
