defmodule Backend.Agents.QuizGraderTest do
  use ExUnit.Case, async: true

  alias Backend.Agents.QuizGrader

  describe "grade/3 single choice" do
    test "grades correct answer" do
      questions = [%{"id" => "q1", "type" => "single", "question" => "1+1?", "options" => ["1", "2", "3"], "answer" => 1, "points" => 1}]
      answers = [%{"question_id" => "q1", "answer" => 1}]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert result.total_score == 1
      assert result.percent == 100
      assert hd(result.results).correct == true
    end

    test "grades incorrect answer" do
      questions = [%{"id" => "q1", "type" => "single", "question" => "1+1?", "options" => ["1", "2", "3"], "answer" => 1, "points" => 1}]
      answers = [%{"question_id" => "q1", "answer" => 0}]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert result.total_score == 0
      assert result.percent == 0
      assert hd(result.results).correct == false
    end

    test "grades multiple questions" do
      questions = [
        %{"id" => "q1", "type" => "single", "question" => "1+1?", "options" => ["1", "2"], "answer" => 1, "points" => 1},
        %{"id" => "q2", "type" => "single", "question" => "2+2?", "options" => ["3", "4"], "answer" => 1, "points" => 2}
      ]
      answers = [
        %{"question_id" => "q1", "answer" => 1},
        %{"question_id" => "q2", "answer" => 0}
      ]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert result.total_score == 1
      assert result.total_points == 3
      assert result.percent == 33
    end
  end

  describe "grade/3 multiple choice" do
    test "grades correct multiple selection" do
      questions = [%{"id" => "q1", "type" => "multiple", "question" => "Select even numbers", "options" => ["1", "2", "3", "4"], "answer" => [1, 3], "points" => 2}]
      answers = [%{"question_id" => "q1", "answer" => [1, 3]}]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert hd(result.results).correct == true
      assert result.total_score == 2
    end

    test "grades incorrect multiple selection" do
      questions = [%{"id" => "q1", "type" => "multiple", "question" => "Select even", "options" => ["1", "2", "3", "4"], "answer" => [1, 3], "points" => 2}]
      answers = [%{"question_id" => "q1", "answer" => [1]}]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert hd(result.results).correct == false
    end
  end

  describe "grade/3 short answer" do
    test "gives zero for empty answer" do
      questions = [%{"id" => "q1", "type" => "short_answer", "question" => "What is Elixir?", "points" => 3}]
      answers = [%{"question_id" => "q1", "answer" => ""}]

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert hd(result.results).score == 0
      assert hd(result.results).feedback == "No answer provided."
    end
  end

  describe "grade/3 missing answers" do
    test "handles missing answer for question" do
      questions = [%{"id" => "q1", "type" => "single", "question" => "1+1?", "options" => ["1", "2"], "answer" => 1, "points" => 1}]
      answers = []

      {:ok, result} = QuizGrader.grade(questions, answers)
      assert hd(result.results).correct == false
    end
  end
end
