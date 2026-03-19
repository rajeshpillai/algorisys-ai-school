defmodule BackendWeb.CourseController do
  use BackendWeb, :controller

  def subjects(conn, _params) do
    json(conn, %{subjects: []})
  end

  def show(conn, %{"id" => _id}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "Course not found"})
  end
end
