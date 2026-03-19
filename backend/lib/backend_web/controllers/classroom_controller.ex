defmodule BackendWeb.ClassroomController do
  use BackendWeb, :controller

  def start(conn, _params) do
    json(conn, %{status: "not_implemented", message: "Classroom start not yet implemented"})
  end

  def message(conn, %{"id" => _id}) do
    json(conn, %{status: "not_implemented", message: "Classroom message not yet implemented"})
  end

  def action(conn, %{"id" => _id}) do
    json(conn, %{status: "not_implemented", message: "Classroom action not yet implemented"})
  end
end
