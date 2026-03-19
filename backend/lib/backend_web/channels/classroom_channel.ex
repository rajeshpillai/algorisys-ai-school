defmodule BackendWeb.ClassroomChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("classroom:" <> session_id, _params, socket) do
    # Subscribe to PubSub for this session
    Phoenix.PubSub.subscribe(Backend.PubSub, "classroom:#{session_id}")
    Logger.info("Client joined classroom:#{session_id}")
    {:ok, assign(socket, :session_id, session_id)}
  end

  # Handle PubSub broadcasts and forward to the WebSocket channel
  @impl true
  def handle_info({:agent_message, msg}, socket) do
    push(socket, "agent_message", msg)
    {:noreply, socket}
  end

  def handle_info({:agent_chunk, chunk}, socket) do
    push(socket, "agent_chunk", chunk)
    {:noreply, socket}
  end

  def handle_info({:agent_done, data}, socket) do
    push(socket, "agent_done", data)
    {:noreply, socket}
  end

  def handle_info(msg, socket) do
    Logger.debug("ClassroomChannel received unexpected message: #{inspect(msg)}")
    {:noreply, socket}
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
