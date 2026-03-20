defmodule BackendWeb.SessionHistoryController do
  use BackendWeb, :controller

  alias Backend.Classroom.Store

  def index(conn, %{"learner_id" => learner_id}) when byte_size(learner_id) > 0 do
    sessions =
      Store.list_sessions(learner_id)
      |> Enum.map(fn s ->
        %{
          id: s.id,
          goal: s.goal,
          state: s.state,
          current_topic: s.current_topic,
          agent_count: length(s.agents || []),
          message_count: s.message_count,
          created_at: s.created_at,
          last_activity: s.last_activity
        }
      end)

    json(conn, %{sessions: sessions})
  end

  def index(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{error: "learner_id is required"})
  end
end
