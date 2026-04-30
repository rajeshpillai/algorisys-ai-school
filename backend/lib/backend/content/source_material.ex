defmodule Backend.Content.SourceMaterial do
  @moduledoc """
  Context for managing uploaded source materials (PDFs).
  Handles creation, retrieval, and relevant excerpt extraction.
  """

  alias Backend.Repo
  alias Backend.Content.Schemas.SourceMaterial, as: Schema
  alias Backend.Content.PdfParser

  @doc """
  Create a source material from an uploaded PDF binary.
  Extracts text via pdftotext and stores the result.
  """
  def create_from_pdf(filename, pdf_binary) do
    case PdfParser.extract(pdf_binary) do
      {:ok, %{text: text, page_count: page_count}} ->
        if String.length(text) < 50 do
          {:error, :no_text_content}
        else
          %Schema{}
          |> Schema.changeset(%{
            filename: filename,
            content: text,
            page_count: page_count,
            char_count: String.length(text)
          })
          |> Repo.insert()
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc "Get a source material by ID."
  def get(id), do: Repo.get(Schema, id)

  @doc """
  Generate a summary of the source material content.
  Truncates to first ~2000 chars as a simple summary.
  Can be upgraded to LLM-based summarization later.
  """
  def get_summary(%Schema{summary: summary}) when is_binary(summary) and summary != "",
    do: summary

  def get_summary(%Schema{content: content}) do
    content
    |> String.slice(0, 2000)
    |> then(fn text ->
      if String.length(content) > 2000, do: text <> "\n\n[... truncated]", else: text
    end)
  end

  @doc """
  Extract paragraphs from the source material that are most relevant
  to the given topic. Uses simple keyword overlap scoring.
  Returns up to ~3000 characters of relevant content.
  """
  def extract_relevant_excerpt(%Schema{content: content}, topic) when is_binary(topic) do
    topic_words =
      topic
      |> String.downcase()
      |> String.split(~r/\W+/, trim: true)
      |> MapSet.new()

    content
    |> String.split(~r/\n\n+/, trim: true)
    |> Enum.filter(fn p -> String.length(p) > 30 end)
    |> Enum.map(fn paragraph ->
      words = paragraph |> String.downcase() |> String.split(~r/\W+/, trim: true) |> MapSet.new()
      score = MapSet.intersection(words, topic_words) |> MapSet.size()
      {score, paragraph}
    end)
    |> Enum.sort_by(fn {score, _} -> score end, :desc)
    |> Enum.take(5)
    |> Enum.filter(fn {score, _} -> score > 0 end)
    |> Enum.map(fn {_, p} -> p end)
    |> Enum.join("\n\n")
    |> String.slice(0, 3000)
  end

  def extract_relevant_excerpt(_, _), do: ""
end
