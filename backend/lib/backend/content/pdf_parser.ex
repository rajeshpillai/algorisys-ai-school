defmodule Backend.Content.PdfParser do
  @moduledoc """
  Extracts text from PDF files using pdftotext (poppler-utils).
  """

  require Logger

  @doc """
  Extract text from a PDF binary.
  Returns {:ok, %{text: text, page_count: count}} or {:error, reason}.
  """
  def extract(pdf_binary) when is_binary(pdf_binary) do
    tmp_path = tmp_file_path()

    try do
      File.write!(tmp_path, pdf_binary)

      case System.cmd("pdftotext", ["-layout", tmp_path, "-"], stderr_to_stdout: true) do
        {text, 0} ->
          page_count = count_pages(tmp_path)
          {:ok, %{text: String.trim(text), page_count: page_count}}

        {error, _code} ->
          Logger.error("pdftotext failed: #{error}")
          {:error, :extraction_failed}
      end
    rescue
      e ->
        Logger.error("PDF extraction error: #{Exception.message(e)}")
        {:error, :extraction_failed}
    after
      File.rm(tmp_path)
    end
  end

  defp count_pages(pdf_path) do
    case System.cmd("pdfinfo", [pdf_path], stderr_to_stdout: true) do
      {output, 0} ->
        case Regex.run(~r/Pages:\s+(\d+)/, output) do
          [_, count] -> String.to_integer(count)
          _ -> 0
        end

      _ ->
        0
    end
  end

  defp tmp_file_path do
    Path.join(System.tmp_dir!(), "pdf_upload_#{:crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)}.pdf")
  end
end
