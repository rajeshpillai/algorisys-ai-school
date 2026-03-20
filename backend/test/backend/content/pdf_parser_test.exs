defmodule Backend.Content.PdfParserTest do
  use ExUnit.Case, async: true

  alias Backend.Content.PdfParser

  @fixture_path "test/fixtures/sample.pdf"

  describe "extract/1" do
    test "extracts text from a valid PDF" do
      binary = File.read!(@fixture_path)
      assert {:ok, %{text: text, page_count: page_count}} = PdfParser.extract(binary)
      assert String.contains?(text, "Binary search")
      assert is_integer(page_count)
    end

    test "returns error for invalid binary" do
      assert {:error, :extraction_failed} = PdfParser.extract("not a pdf")
    end

    test "returns error for empty binary" do
      assert {:error, :extraction_failed} = PdfParser.extract("")
    end
  end
end
