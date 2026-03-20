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

    get "/sessions", SessionHistoryController, :index

    post "/classroom/start", ClassroomController, :start
    get "/classroom/:id", ClassroomController, :show
    post "/classroom/:id/message", ClassroomController, :message
    post "/classroom/:id/action", ClassroomController, :perform_action
    post "/classroom/:id/resume", ClassroomController, :resume
  end
end
