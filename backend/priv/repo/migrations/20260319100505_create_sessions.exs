defmodule Backend.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def change do
    create table(:sessions, primary_key: false) do
      add :id, :string, primary_key: true
      add :goal, :text, null: false
      add :learner_profile, :text
      add :state, :string, null: false, default: "initializing"
      add :agents, :jsonb, default: "[]"
      add :learner_state, :jsonb, null: false
      add :current_scene, :string
      add :current_scene_spec, :jsonb
      add :current_topic, :string
      add :current_agent, :string
      add :orchestrator_decision, :jsonb

      timestamps()
    end

    create index(:sessions, [:state])
    create index(:sessions, [:inserted_at])
  end
end
