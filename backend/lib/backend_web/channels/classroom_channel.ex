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

  def handle_in(_event, _payload, socket) do
    {:noreply, socket}
  end
end
