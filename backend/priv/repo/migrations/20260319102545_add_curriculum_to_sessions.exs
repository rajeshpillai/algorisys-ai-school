defmodule Backend.Repo.Migrations.AddCurriculumToSessions do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add :curriculum_plan, :jsonb
      add :current_module_index, :integer, default: 0, null: false
      add :current_lesson_index, :integer, default: 0, null: false
    end
  end
end
