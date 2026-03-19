defmodule BackendWeb.ClassroomController do
  use BackendWeb, :controller

  require Logger

  def start(conn, params) do
    goal = params["goal"]

    if is_nil(goal) or goal == "" do
      conn
      |> put_status(400)
      |> json(%{error: "goal is required"})
    else
      learner_profile = params["learner_profile"]
      llm_config = sanitize_llm_config(params["llm_config"])
      session_id = generate_session_id()

      case Backend.Classroom.SessionSupervisor.start_session(session_id, goal, learner_profile, llm_config) do
        {:ok, _pid} ->
          Logger.info("Started classroom session #{session_id}")
          json(conn, %{session_id: session_id, status: "starting"})

        {:error, reason} ->
          Logger.error("Failed to start session: #{inspect(reason)}")

          conn
          |> put_status(500)
          |> json(%{error: "Failed to start session"})
      end
    end
  end

  def show(conn, %{"id" => id}) do
    case Backend.Classroom.Session.get_state(id) do
      {:error, :not_found} ->
        conn
        |> put_status(404)
        |> json(%{error: "Session not found"})

      state ->
        json(conn, state)
    end
  end

  def message(conn, %{"id" => id} = params) do
    content = params["content"]

    if is_nil(content) or content == "" do
      conn
      |> put_status(400)
      |> json(%{error: "content is required"})
    else
      Backend.Classroom.Session.send_message(id, content)
      json(conn, %{status: "ok"})
    end
  end

  def perform_action(conn, %{"id" => id} = params) do
    action_data = params["action"]
    Backend.Classroom.Session.send_action(id, action_data)
    json(conn, %{status: "ok"})
  end

  defp generate_session_id do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end

  defp sanitize_llm_config(nil), do: nil
  defp sanitize_llm_config(config) when is_map(config) do
    config
    |> Map.take(["provider", "openai_api_key", "anthropic_api_key", "ollama_base_url"])
    |> case do
      empty when map_size(empty) == 0 -> nil
      sanitized -> sanitized
    end
  end
  defp sanitize_llm_config(_), do: nil
end
