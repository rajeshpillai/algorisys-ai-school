defmodule Backend.Classroom.Session do
  @moduledoc """
  GenServer managing an individual classroom session.
  Tracks learner state, handles messages, and coordinates with agents.
  """

  use GenServer

  def start_link(opts) do
    session_id = Keyword.fetch!(opts, :session_id)
    GenServer.start_link(__MODULE__, opts, name: via_tuple(session_id))
  end

  defp via_tuple(session_id) do
    {:via, Registry, {Backend.SessionRegistry, session_id}}
  end

  @impl true
  def init(opts) do
    {:ok, %{session_id: Keyword.fetch!(opts, :session_id)}}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, state, state}
  end

  @impl true
  def handle_cast(_msg, state) do
    {:noreply, state}
  end
end
