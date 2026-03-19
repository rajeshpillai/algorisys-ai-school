defmodule BackendWeb.Router do
  use BackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", BackendWeb do
    pipe_through :api

    get "/health", HealthController, :index

    get "/subjects", CourseController, :subjects
    get "/courses/:id", CourseController, :show
    get "/lessons/:id", LessonController, :show

    post "/classroom/start", ClassroomController, :start
    post "/classroom/:id/message", ClassroomController, :message
    post "/classroom/:id/action", ClassroomController, :action
  end
end
