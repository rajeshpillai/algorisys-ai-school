defmodule Backend.DataCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require database access.

  Uses Ecto.Adapters.SQL.Sandbox so each test runs
  in a transaction that is rolled back at the end.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      alias Backend.Repo
      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import Backend.DataCase
    end
  end

  setup tags do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(Backend.Repo, shared: not tags[:async])
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
    :ok
  end
end
