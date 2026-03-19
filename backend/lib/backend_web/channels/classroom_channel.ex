defmodule BackendWeb.ClassroomChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("classroom:" <> session_id, _params, socket) do
    Logger.info("Client joined classroom:#{session_id}")
    {:ok, assign(socket, :session_id, session_id)}
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

  def handle_in("submit_quiz", %{"questions" => questions, "answers" => answers}, socket) do
    llm_config = socket.assigns[:llm_config]
    opts = if llm_config, do: [llm_config: llm_config], else: []

    Task.start(fn ->
      case Backend.Agents.QuizGrader.grade(questions, answers, opts) do
        {:ok, result} ->
          BackendWeb.Endpoint.broadcast(
            "classroom:#{socket.assigns.session_id}",
            "quiz_result",
            result
          )

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
