defmodule Backend.Classroom.Store do
  @moduledoc """
  Persistence boundary between the Session GenServer and the database.
  Handles creating, saving, loading, and resuming sessions.
  """

  alias Backend.Repo
  alias Backend.Classroom.Schemas.{Session, Message}
  alias Backend.Classroom.LearnerState
  import Ecto.Query

  def create_session(id, goal, learner_profile) do
    %Session{}
    |> Session.changeset(%{
      id: id,
      goal: goal,
      learner_profile: learner_profile,
      state: "initializing",
      learner_state: LearnerState.to_map(%LearnerState{})
    })
    |> Repo.insert()
  end

  def save_state(gen_server_state) do
    case Repo.get(Session, gen_server_state.id) do
      nil ->
        {:error, :not_found}

      session ->
        session
        |> Session.changeset(%{
          state: to_string(gen_server_state.state),
          agents: gen_server_state.agents,
          learner_state: LearnerState.to_map(gen_server_state.learner_state),
          current_scene: gen_server_state.current_scene,
          current_scene_spec: gen_server_state.current_scene_spec,
          current_topic: gen_server_state.current_topic,
          current_agent: gen_server_state.current_agent,
          orchestrator_decision: gen_server_state.orchestrator_decision
        })
        |> Repo.update()
    end
  end

  def append_message(session_id, role, content, agent_name \\ nil, agent_role \\ nil) do
    position = next_position(session_id)

    %Message{}
    |> Message.changeset(%{
      session_id: session_id,
      role: role,
      content: content,
      agent_name: agent_name,
      agent_role: agent_role,
      position: position
    })
    |> Repo.insert()
  end

  def load_session(session_id) do
    Session
    |> Repo.get(session_id)
    |> case do
      nil -> nil
      session -> Repo.preload(session, messages: from(m in Message, order_by: m.position))
    end
  end

  defp next_position(session_id) do
    query =
      from m in Message,
        where: m.session_id == ^session_id,
        select: coalesce(max(m.position), 0)

    Repo.one(query) + 1
  end
end
