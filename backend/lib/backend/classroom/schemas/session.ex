defmodule Backend.Classroom.Schemas.Session do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :string, autogenerate: false}
  schema "sessions" do
    field :goal, :string
    field :learner_profile, :string
    field :state, :string, default: "initializing"
    field :agents, {:array, :map}, default: []
    field :learner_state, :map
    field :current_scene, :string
    field :current_scene_spec, :map
    field :current_topic, :string
    field :current_agent, :string
    field :orchestrator_decision, :map

    has_many :messages, Backend.Classroom.Schemas.Message

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [
      :id, :goal, :learner_profile, :state, :agents, :learner_state,
      :current_scene, :current_scene_spec, :current_topic,
      :current_agent, :orchestrator_decision
    ])
    |> validate_required([:id, :goal, :state, :learner_state])
    |> validate_inclusion(:state, ~w(initializing teaching waiting))
  end
end
