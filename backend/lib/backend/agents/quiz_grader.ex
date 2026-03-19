defmodule Backend.Agents.QuizGrader do
  @moduledoc """
  Grades quiz answers. Choice questions are graded locally.
  Short-answer questions are graded via LLM.
  """

  require Logger

  alias Backend.LLM.Client

  @model "gpt-4o-mini"

  @doc """
  Grade a list of answers against questions.

  Returns {:ok, %{total_score, total_points, percent, results}} or {:error, reason}.
  """
  @spec grade(list(map()), list(map()), keyword()) :: {:ok, map()} | {:error, term()}
  def grade(questions, answers, opts \\ []) do
    results =
      Enum.map(questions, fn q ->
        answer = find_answer(answers, q["id"])
        grade_question(q, answer, opts)
      end)

    total_score = Enum.reduce(results, 0, fn r, acc -> acc + r.score end)
    total_points = Enum.reduce(results, 0, fn r, acc -> acc + r.max_points end)
    percent = if total_points > 0, do: round(total_score / total_points * 100), else: 0

    {:ok, %{
      total_score: total_score,
      total_points: total_points,
      percent: percent,
      results: results
    }}
  end

  defp find_answer(answers, question_id) do
    Enum.find(answers, fn a ->
      (a["question_id"] || a[:question_id]) == question_id
    end)
  end

  defp grade_question(%{"type" => "single"} = q, answer, _opts) do
    correct_idx = q["answer"]
    user_answer = get_answer_value(answer)
    points = q["points"] || 1

    is_correct = user_answer == correct_idx

    %{
      question_id: q["id"],
      correct: is_correct,
      score: if(is_correct, do: points, else: 0),
      max_points: points,
      feedback: if(is_correct, do: "Correct!", else: "Incorrect. The correct answer was option #{correct_idx + 1}.")
    }
  end

  defp grade_question(%{"type" => "multiple"} = q, answer, _opts) do
    correct_indices = q["answer"] || []
    user_indices = get_answer_value(answer) || []
    user_indices = if is_list(user_indices), do: Enum.sort(user_indices), else: [user_indices]
    points = q["points"] || 1

    is_correct = Enum.sort(correct_indices) == user_indices

    %{
      question_id: q["id"],
      correct: is_correct,
      score: if(is_correct, do: points, else: 0),
      max_points: points,
      feedback: if(is_correct, do: "Correct!", else: "Not all correct options were selected.")
    }
  end

  defp grade_question(%{"type" => "short_answer"} = q, answer, opts) do
    user_text = to_string(get_answer_value(answer) || "")
    points = q["points"] || 1

    if String.trim(user_text) == "" do
      %{
        question_id: q["id"],
        correct: false,
        score: 0,
        max_points: points,
        feedback: "No answer provided."
      }
    else
      grade_with_llm(q, user_text, points, opts)
    end
  end

  defp grade_question(q, _answer, _opts) do
    %{
      question_id: q["id"] || "unknown",
      correct: false,
      score: 0,
      max_points: q["points"] || 1,
      feedback: "Unsupported question type."
    }
  end

  defp grade_with_llm(question, user_answer, points, opts) do
    messages = [
      %{role: "system", content: """
      You are a quiz grader. Grade the student's answer to the question.
      Respond with valid JSON only:
      {"score": <0 to #{points}>, "feedback": "<brief feedback>"}
      """},
      %{role: "user", content: """
      Question: #{question["question"]}
      Student's answer: #{user_answer}
      Maximum points: #{points}
      """}
    ]

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    case Client.chat_json(messages, llm_opts) do
      {:ok, result} ->
        score = min(result["score"] || 0, points)

        %{
          question_id: question["id"],
          correct: score == points,
          score: score,
          max_points: points,
          feedback: result["feedback"] || "Graded."
        }

      {:error, _reason} ->
        # Fallback: give half credit
        %{
          question_id: question["id"],
          correct: false,
          score: round(points * 0.5),
          max_points: points,
          feedback: "Could not grade automatically. Partial credit awarded."
        }
    end
  end

  defp get_answer_value(nil), do: nil
  defp get_answer_value(answer), do: answer["answer"] || answer[:answer]
end
