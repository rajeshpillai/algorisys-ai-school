defmodule Backend.Agents.LearnerModelTest do
  use ExUnit.Case, async: true

  alias Backend.Agents.LearnerModel
  alias Backend.Classroom.LearnerState

  describe "apply_response/3 (unit, no LLM)" do
    test "merges scores and lists from a well-formed response" do
      prior = %LearnerState{understanding_score: 50, confidence: 50, known_concepts: ["a"]}

      response = %{
        "learner_state" => %{
          "understanding_score" => 75,
          "confidence" => 65,
          "known_concepts" => ["a", "b"],
          "topics_completed" => ["intro"]
        },
        "signals" => %{"ready_to_advance" => true},
        "reasoning" => "Made progress on b."
      }

      assert {:ok, %LearnerState{} = updated} = LearnerModel.apply_response(prior, response)
      assert updated.understanding_score == 75
      assert updated.confidence == 65
      assert updated.known_concepts == ["a", "b"]
      assert updated.topics_completed == ["intro"]
    end

    test "preserves fields not mentioned by the LLM" do
      prior = %LearnerState{
        understanding_score: 80,
        confidence: 70,
        preferred_style: "visual",
        known_concepts: ["functions", "loops"]
      }

      response = %{"learner_state" => %{"fatigue" => 40}}

      assert {:ok, updated} = LearnerModel.apply_response(prior, response)
      assert updated.fatigue == 40
      assert updated.understanding_score == 80
      assert updated.confidence == 70
      assert updated.preferred_style == "visual"
      assert updated.known_concepts == ["functions", "loops"]
    end

    test "flattens map-shaped misconceptions into descriptive strings" do
      prior = %LearnerState{misconceptions: ["old"]}

      response = %{
        "learner_state" => %{
          "misconceptions" => [
            %{
              "concept" => "recursion",
              "incorrect_belief" => "must always have base case at the top",
              "severity" => "blocking"
            },
            %{"concept" => "scope", "incorrect_belief" => "block scope == function scope"}
          ]
        }
      }

      assert {:ok, updated} = LearnerModel.apply_response(prior, response)
      assert length(updated.misconceptions) == 2
      assert Enum.any?(updated.misconceptions, &String.contains?(&1, "recursion"))
      assert Enum.any?(updated.misconceptions, &String.starts_with?(&1, "[blocking]"))
    end

    test "passes string-shaped misconceptions through unchanged" do
      prior = %LearnerState{}
      response = %{"learner_state" => %{"misconceptions" => ["off-by-one in loops"]}}

      assert {:ok, updated} = LearnerModel.apply_response(prior, response)
      assert updated.misconceptions == ["off-by-one in loops"]
    end

    test "returns :error when learner_state key is missing" do
      prior = %LearnerState{}
      assert {:error, _} = LearnerModel.apply_response(prior, %{"signals" => %{}})
    end

    test "returns :error when learner_state is not a map" do
      prior = %LearnerState{}
      assert {:error, _} = LearnerModel.apply_response(prior, %{"learner_state" => "garbage"})
    end

    test "clamps out-of-range scores via merge_updates" do
      prior = %LearnerState{}

      response = %{
        "learner_state" => %{"understanding_score" => 250, "fatigue" => -50}
      }

      assert {:ok, updated} = LearnerModel.apply_response(prior, response)
      assert updated.understanding_score == 100
      assert updated.fatigue == 0
    end

    test "accepts atom-keyed response (defensive)" do
      prior = %LearnerState{}
      response = %{learner_state: %{understanding_score: 88}}

      assert {:ok, updated} = LearnerModel.apply_response(prior, response)
      assert updated.understanding_score == 88
    end
  end

  describe "evaluate/5 (LLM integration)" do
    @moduletag :llm_integration

    test "returns an updated LearnerState struct from a real LLM call" do
      prior = %LearnerState{understanding_score: 50, confidence: 50}

      messages = [
        %{
          role: "assistant",
          content:
            "A function is a reusable block of code that takes inputs and returns an output."
        },
        %{
          role: "user",
          content:
            "So a function is like a recipe? You give it ingredients and it gives you a dish?"
        }
      ]

      case LearnerModel.evaluate(prior, messages, "functions", %{"level" => "beginner"}) do
        {:ok, %LearnerState{} = updated} ->
          assert is_integer(updated.understanding_score)
          assert updated.understanding_score in 0..100
          assert is_integer(updated.confidence)
          assert is_integer(updated.fatigue)

        {:error, reason} ->
          flunk("Expected {:ok, _}, got error: #{inspect(reason)}")
      end
    end
  end
end
