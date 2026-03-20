defmodule Backend.Repo.Migrations.AddLearnerIdToSessions do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add :learner_id, :string
    end

    create index(:sessions, [:learner_id])
  end
end
