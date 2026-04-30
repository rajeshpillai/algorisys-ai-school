defmodule Backend.Agents.QuizDesignerTest do
  use ExUnit.Case, async: true

  alias Backend.Agents.{QuizDesigner, QuizGrader}
  alias Backend.Classroom.LearnerState

  describe "validate_questions/1 (unit, no LLM)" do
    test "accepts a well-formed single-choice question" do
      questions = [
        %{
          "id" => "q1",
          "type" => "single",
          "question" => "What is 2 + 2?",
          "options" => ["3", "4", "5"],
          "answer" => 1,
          "points" => 1
        }
      ]

      assert {:ok, [validated]} = QuizDesigner.validate_questions(questions)
      assert validated["id"] == "q1"
      assert validated["type"] == "single"
    end

    test "accepts a well-formed multiple-choice question" do
      questions = [
        %{
          "id" => "q1",
          "type" => "multiple",
          "question" => "Which are even?",
          "options" => ["1", "2", "3", "4"],
          "answer" => [1, 3],
          "points" => 2
        }
      ]

      assert {:ok, [_]} = QuizDesigner.validate_questions(questions)
    end

    test "accepts a well-formed short-answer question" do
      questions = [
        %{
          "id" => "q1",
          "type" => "short_answer",
          "question" => "Explain recursion in one sentence.",
          "points" => 3
        }
      ]

      assert {:ok, [_]} = QuizDesigner.validate_questions(questions)
    end

    test "defaults points to 1 when missing" do
      questions = [
        %{
          "id" => "q1",
          "type" => "short_answer",
          "question" => "Explain recursion."
        }
      ]

      assert {:ok, [validated]} = QuizDesigner.validate_questions(questions)
      assert validated["points"] == 1
    end

    test "accepts atom-keyed questions and normalizes them" do
      questions = [
        %{
          id: "q1",
          type: "single",
          question: "Pick one",
          options: ["a", "b"],
          answer: 0
        }
      ]

      assert {:ok, [validated]} = QuizDesigner.validate_questions(questions)
      assert validated["id"] == "q1"
      assert validated["type"] == "single"
    end

    test "rejects an empty list" do
      assert {:error, :no_questions} = QuizDesigner.validate_questions([])
    end

    test "rejects a question missing the type field" do
      assert {:error, {:missing_field, "type"}} =
               QuizDesigner.validate_questions([%{"id" => "q1", "question" => "?"}])
    end

    test "rejects a question with unknown type" do
      questions = [%{"id" => "q1", "type" => "essay", "question" => "?"}]
      assert {:error, {:invalid_type, "essay"}} = QuizDesigner.validate_questions(questions)
    end

    test "rejects single-choice with answer index out of bounds" do
      questions = [
        %{
          "id" => "q1",
          "type" => "single",
          "question" => "?",
          "options" => ["a", "b"],
          "answer" => 5
        }
      ]

      assert {:error, {:bad_answer, "q1"}} = QuizDesigner.validate_questions(questions)
    end

    test "rejects single-choice with too few options" do
      questions = [
        %{
          "id" => "q1",
          "type" => "single",
          "question" => "?",
          "options" => ["a"],
          "answer" => 0
        }
      ]

      assert {:error, {:bad_options, "q1"}} = QuizDesigner.validate_questions(questions)
    end

    test "rejects multiple-choice with empty answer list" do
      questions = [
        %{
          "id" => "q1",
          "type" => "multiple",
          "question" => "?",
          "options" => ["a", "b"],
          "answer" => []
        }
      ]

      assert {:error, {:bad_answer, "q1"}} = QuizDesigner.validate_questions(questions)
    end

    test "rejects multiple-choice with answer index out of bounds" do
      questions = [
        %{
          "id" => "q1",
          "type" => "multiple",
          "question" => "?",
          "options" => ["a", "b"],
          "answer" => [0, 7]
        }
      ]

      assert {:error, {:bad_answer, "q1"}} = QuizDesigner.validate_questions(questions)
    end
  end

  describe "QuizGrader compatibility" do
    test "validated questions can be graded by QuizGrader" do
      questions = [
        %{
          "id" => "q1",
          "type" => "single",
          "question" => "What is 2 + 2?",
          "options" => ["3", "4", "5"],
          "answer" => 1,
          "points" => 2
        },
        %{
          "id" => "q2",
          "type" => "multiple",
          "question" => "Pick the even numbers",
          "options" => ["1", "2", "3", "4"],
          "answer" => [1, 3],
          "points" => 3
        }
      ]

      {:ok, validated} = QuizDesigner.validate_questions(questions)

      answers = [
        %{"question_id" => "q1", "answer" => 1},
        %{"question_id" => "q2", "answer" => [1, 3]}
      ]

      assert {:ok, %{percent: 100, total_score: 5, total_points: 5}} =
               QuizGrader.grade(validated, answers)
    end
  end

  describe "design_quiz/5 (LLM integration)" do
    @moduletag :llm_integration

    test "returns validated questions for a known topic" do
      learner_state = %LearnerState{
        misconceptions: ["thinks pure functions can read globals if they don't write"],
        known_concepts: ["functions"]
      }

      case QuizDesigner.design_quiz("pure functions", :medium, 3, learner_state) do
        {:ok, questions} ->
          assert length(questions) >= 1
          assert length(questions) <= 3

          assert Enum.all?(questions, fn q ->
                   q["type"] in ["single", "multiple", "short_answer"] and
                     is_binary(q["question"]) and
                     is_binary(q["id"])
                 end)

          # Round-trip through QuizGrader to confirm schema compatibility.
          # Provide empty answers — we just check that grading doesn't crash.
          assert {:ok, _result} = QuizGrader.grade(questions, [])

        {:error, reason} ->
          flunk("Expected {:ok, _}, got: #{inspect(reason)}")
      end
    end
  end
end
