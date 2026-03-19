defmodule Backend.Classroom.SessionSupervisor do
  @moduledoc """
  DynamicSupervisor for managing classroom session processes.
  """

  use DynamicSupervisor

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def start_session(opts) do
    DynamicSupervisor.start_child(__MODULE__, {Backend.Classroom.Session, opts})
  end
end
