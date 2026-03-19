defmodule BackendWeb.LessonController do
  use BackendWeb, :controller

  def show(conn, %{"id" => _id}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "Lesson not found"})
  end
end
