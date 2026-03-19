defmodule Backend.Classroom.SessionSupervisor do
  @moduledoc """
  DynamicSupervisor for managing classroom session processes.
  Each session is a GenServer supervised under this supervisor.
  """

  use DynamicSupervisor

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Start a new classroom session with the given ID, goal, and learner profile.
  """
  def start_session(session_id, goal, learner_profile) do
    DynamicSupervisor.start_child(__MODULE__, {
      Backend.Classroom.Session,
      id: session_id, goal: goal, learner_profile: learner_profile
    })
  end
end
