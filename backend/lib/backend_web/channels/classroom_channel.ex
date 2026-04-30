defmodule BackendWeb.ClassroomChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("classroom:" <> session_id, _params, socket) do
    Logger.info("Client joined classroom:#{session_id}")

    snapshot =
      case Backend.Classroom.Session.snapshot(session_id) do
        {:ok, snap} -> snap
        {:error, _} -> empty_snapshot(session_id)
      end

    {:ok, snapshot, assign(socket, :session_id, session_id)}
  end

  defp empty_snapshot(session_id) do
    %{
      id: session_id,
      state: :initializing,
      agents: [],
      messages: [],
      current_topic: nil,
      current_scene: nil,
      current_agent: nil,
      curriculum: %{
        plan: nil,
        current_module_index: 0,
        current_lesson_index: 0,
        total_lessons: 0,
        completed_lessons: 0
      },
      learner_state: nil
    }
  end

  # Handle messages from the client via WebSocket
  @impl true
  def handle_in("send_message", %{"content" => content}, socket) do
    session_id = socket.assigns.session_id
    Backend.Classroom.Session.send_message(session_id, content)
    {:noreply, socket}
  end

  def handle_in("send_action", %{"action" => action}, socket) do
    session_id = socket.assigns.session_id
    Backend.Classroom.Session.send_action(session_id, action)
    {:noreply, socket}
  end

  def handle_in(
        "submit_quiz",
        %{"questions" => questions, "answers" => answers} = payload,
        socket
      ) do
    llm_config = socket.assigns[:llm_config]
    opts = if llm_config, do: [llm_config: llm_config], else: []
    session_id = socket.assigns.session_id
    topic = payload["topic"]

    Task.start(fn ->
      case Backend.Agents.QuizGrader.grade(questions, answers, opts) do
        {:ok, result} ->
          BackendWeb.Endpoint.broadcast("classroom:#{session_id}", "quiz_result", result)
          Backend.Classroom.Session.record_quiz_result(session_id, topic, result)

        {:error, reason} ->
          Logger.error("Quiz grading failed: #{inspect(reason)}")
      end
    end)

    {:noreply, socket}
  end

  def handle_in(_event, _payload, socket) do
    {:noreply, socket}
  end
end
