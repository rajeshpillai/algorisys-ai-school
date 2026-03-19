defmodule BackendWeb.ClassroomChannel do
  use Phoenix.Channel

  @impl true
  def join("classroom:" <> _session_id, _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("message", payload, socket) do
    {:reply, {:ok, %{status: "received", payload: payload}}, socket}
  end

  @impl true
  def handle_in("action", payload, socket) do
    {:reply, {:ok, %{status: "received", payload: payload}}, socket}
  end
end
