defmodule BackendWeb.LessonController do
  use BackendWeb, :controller

  alias Backend.Content.Loader

  def show(conn, %{"id" => id}) do
    case Loader.load_lesson(id) do
      {:ok, lesson} ->
        json(conn, %{lesson: lesson})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Lesson not found"})
    end
  end
end
