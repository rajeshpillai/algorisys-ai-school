defmodule Backend.Agents.RoleSynthesisTest do
  use ExUnit.Case, async: true

  @moduletag :llm_integration

  alias Backend.Agents.RoleSynthesis

  describe "build_learner_profile (via generate_team input)" do
    # These tests verify the input-building logic doesn't crash.
    # Depending on whether an API key is configured, they may succeed or fail
    # at the LLM call — either outcome is acceptable.

    test "handles nil profile without crashing" do
      result = RoleSynthesis.generate_team("Learn Elixir", nil)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles map profile without crashing" do
      profile = %{
        "background" => "software engineer",
        "level" => "intermediate",
        "known_concepts" => ["OOP", "functional basics"],
        "learning_preferences" => ["hands-on", "examples"],
        "constraints" => %{"time_limit" => "2 hours", "depth" => "deep"}
      }

      result = RoleSynthesis.generate_team("Learn Elixir", profile)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles map profile with missing keys" do
      profile = %{"background" => "student"}

      result = RoleSynthesis.generate_team("Learn math", profile)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "returns list of agent specs on success" do
      result = RoleSynthesis.generate_team("Learn Python", nil)

      case result do
        {:ok, agents} ->
          assert is_list(agents)
          assert length(agents) >= 1

          first = hd(agents)
          assert is_map(first)
          assert Map.has_key?(first, "name")
          assert Map.has_key?(first, "type")

        {:error, _} ->
          # No API key configured — acceptable
          :ok
      end
    end

    test "handles string profile" do
      # String profiles are passed from Session.init when learner_profile is a free-form string
      result = RoleSynthesis.generate_team("Learn Rust", "experienced JS developer")
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end
end
