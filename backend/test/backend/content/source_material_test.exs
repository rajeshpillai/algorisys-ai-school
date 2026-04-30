defmodule Backend.Content.SourceMaterialTest do
  use Backend.DataCase, async: true

  alias Backend.Content.SourceMaterial
  alias Backend.Content.Schemas.SourceMaterial, as: Schema

  @fixture_path "test/fixtures/sample.pdf"

  describe "create_from_pdf/2" do
    test "creates source material from a valid PDF" do
      binary = File.read!(@fixture_path)
      assert {:ok, %Schema{} = source} = SourceMaterial.create_from_pdf("test.pdf", binary)
      assert source.filename == "test.pdf"
      assert String.contains?(source.content, "Binary search")
      assert source.char_count > 0
    end
  end

  describe "extract_relevant_excerpt/2" do
    test "returns relevant paragraphs based on topic" do
      source = %Schema{
        content:
          "Binary search is an efficient algorithm for finding an item in a sorted list by repeatedly dividing the search interval in half.\n\nLinked lists are dynamic data structures where each element points to the next element in the sequence.\n\nBinary trees use nodes with left and right children to organize data hierarchically for fast lookup.\n\nHash maps provide O(1) average access time by computing an index from the key using a hash function."
      }

      excerpt = SourceMaterial.extract_relevant_excerpt(source, "binary search trees")
      assert String.contains?(excerpt, "Binary")
    end

    test "returns empty string when no match" do
      source = %Schema{content: "Cooking pasta requires boiling water."}
      excerpt = SourceMaterial.extract_relevant_excerpt(source, "quantum physics")
      assert excerpt == ""
    end

    test "handles nil source gracefully" do
      assert SourceMaterial.extract_relevant_excerpt(nil, "topic") == ""
    end
  end

  describe "get_summary/1" do
    test "returns stored summary if present" do
      source = %Schema{summary: "A brief summary", content: "Long content..."}
      assert SourceMaterial.get_summary(source) == "A brief summary"
    end

    test "truncates content when no summary" do
      long = String.duplicate("word ", 1000)
      source = %Schema{summary: nil, content: long}
      summary = SourceMaterial.get_summary(source)
      assert String.length(summary) <= 2020
      assert String.contains?(summary, "[... truncated]")
    end
  end
end
