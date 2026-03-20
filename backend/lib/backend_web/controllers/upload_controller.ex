defmodule BackendWeb.UploadController do
  use BackendWeb, :controller

  require Logger

  alias Backend.Content.SourceMaterial

  @max_size 20 * 1024 * 1024  # 20 MB

  def create(conn, %{"file" => %Plug.Upload{filename: filename, path: path}}) do
    if not String.ends_with?(String.downcase(filename), ".pdf") do
      conn |> put_status(400) |> json(%{error: "Only PDF files are accepted"})
    else
      case File.read(path) do
        {:ok, binary} when byte_size(binary) > @max_size ->
          conn |> put_status(413) |> json(%{error: "File too large. Maximum size is 20 MB."})

        {:ok, binary} ->
          case SourceMaterial.create_from_pdf(filename, binary) do
            {:ok, source} ->
              json(conn, %{
                source_id: source.id,
                filename: source.filename,
                page_count: source.page_count,
                char_count: source.char_count
              })

            {:error, :no_text_content} ->
              conn
              |> put_status(422)
              |> json(%{error: "Could not extract text from this PDF. It may be scanned or image-based."})

            {:error, _reason} ->
              conn
              |> put_status(500)
              |> json(%{error: "Failed to process PDF"})
          end

        {:error, reason} ->
          Logger.error("Failed to read uploaded file: #{inspect(reason)}")
          conn |> put_status(500) |> json(%{error: "Failed to read uploaded file"})
      end
    end
  end

  def create(conn, _params) do
    conn |> put_status(400) |> json(%{error: "No file provided"})
  end
end
