defmodule Backend.Repo.Migrations.CreateMessages do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add :session_id, references(:sessions, type: :string, on_delete: :delete_all),
          null: false
      add :role, :string, null: false
      add :content, :text, null: false
      add :agent_name, :string
      add :agent_role, :string
      add :position, :integer, null: false

      timestamps(updated_at: false)
    end

    create index(:messages, [:session_id, :position])
  end
end
