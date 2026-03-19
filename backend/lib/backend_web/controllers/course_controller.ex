defmodule BackendWeb.CourseController do
  use BackendWeb, :controller

  alias Backend.Content.Loader

  def subjects(conn, _params) do
    case Loader.load_all_subjects() do
      {:ok, subjects} ->
        json(conn, %{subjects: subjects})

      {:error, _reason} ->
        json(conn, %{subjects: []})
    end
  end

  def show(conn, %{"id" => id}) do
    case Loader.load_course(id) do
      {:ok, course} ->
        json(conn, %{course: course})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Course not found"})
    end
  end
end
