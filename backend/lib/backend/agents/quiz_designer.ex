defmodule Backend.Agents.QuizDesigner do
  @moduledoc """
  Designs structured quiz questions for a topic.

  Output schema matches what `Backend.Agents.QuizGrader.grade/3` consumes:
  questions are maps with `id`, `type` ("single" | "multiple" | "short_answer"),
  `question`, optional `options`, optional `answer`, and `points`.

  When a `LearnerState` is provided, the designer biases questions toward the
  learner's listed misconceptions and recent errors.
  """

  require Logger

  alias Backend.Classroom.LearnerState
  alias Backend.LLM.{Client, PromptBuilder}

  @model "gpt-4o-mini"
  @default_difficulty :medium
  @default_count 4
  @valid_difficulties [:easy, :medium, :hard]
  @valid_types ["single", "multiple", "short_answer"]

  @doc """
  Design a quiz for the given topic.

  Returns `{:ok, questions}` where `questions` is a list of maps validated to
  match the QuizGrader schema, or `{:error, reason}`.
  """
  @spec design_quiz(String.t(), atom(), integer(), LearnerState.t() | nil, keyword()) ::
          {:ok, list(map())} | {:error, term()}
  def design_quiz(
        topic,
        difficulty \\ @default_difficulty,
        count \\ @default_count,
        learner_state \\ nil,
        opts \\ []
      )

  def design_quiz(topic, difficulty, count, learner_state, opts) when is_binary(topic) do
    difficulty = if difficulty in @valid_difficulties, do: difficulty, else: @default_difficulty
    count = if is_integer(count) and count > 0, do: min(count, 10), else: @default_count

    input = %{
      topic: topic,
      difficulty: Atom.to_string(difficulty),
      count: count,
      learner_state: learner_state_to_input(learner_state)
    }

    llm_opts = [model: @model] ++ Keyword.take(opts, [:llm_config])

    with {:ok, prompt} <- PromptBuilder.load_prompt("quiz-designer"),
         messages = PromptBuilder.build_quiz_designer_messages(prompt, input),
         {:ok, response} <- Client.chat_json(messages, llm_opts),
         {:ok, raw_questions} <- extract_questions(response),
         {:ok, validated} <- validate_questions(raw_questions) do
      Logger.info("QuizDesigner produced #{length(validated)} questions for topic: #{topic}")
      {:ok, validated}
    else
      {:error, reason} = err ->
        Logger.error("QuizDesigner failed: #{inspect(reason)}")
        err
    end
  end

  @doc """
  Validate a list of question maps against the QuizGrader schema.

  Public to support unit testing without an LLM call.
  """
  @spec validate_questions(list(map())) :: {:ok, list(map())} | {:error, term()}
  def validate_questions(questions) when is_list(questions) and questions != [] do
    case Enum.reduce_while(questions, [], &validate_one/2) do
      {:error, _} = err -> err
      validated -> {:ok, Enum.reverse(validated)}
    end
  end

  def validate_questions(_), do: {:error, :no_questions}

  defp validate_one(q, acc) when is_map(q) do
    with {:ok, q} <- normalize_keys(q),
         :ok <- check_required(q, ["id", "type", "question"]),
         :ok <- check_type(q),
         :ok <- check_shape(q) do
      {:cont, [Map.put_new(q, "points", 1) | acc]}
    else
      {:error, reason} -> {:halt, {:error, reason}}
    end
  end

  defp validate_one(_, _), do: {:halt, {:error, :question_not_a_map}}

  defp normalize_keys(q) do
    {:ok, Map.new(q, fn {k, v} -> {to_string(k), v} end)}
  end

  defp check_required(q, keys) do
    case Enum.find(keys, fn k -> Map.get(q, k) in [nil, ""] end) do
      nil -> :ok
      missing -> {:error, {:missing_field, missing}}
    end
  end

  defp check_type(%{"type" => type}) when type in @valid_types, do: :ok
  defp check_type(%{"type" => type}), do: {:error, {:invalid_type, type}}

  defp check_shape(%{"type" => "single"} = q) do
    options = q["options"]
    answer = q["answer"]

    cond do
      not is_list(options) or length(options) < 2 ->
        {:error, {:bad_options, q["id"]}}

      not is_integer(answer) or answer < 0 or answer >= length(options) ->
        {:error, {:bad_answer, q["id"]}}

      true ->
        :ok
    end
  end

  defp check_shape(%{"type" => "multiple"} = q) do
    options = q["options"]
    answer = q["answer"]

    cond do
      not is_list(options) or length(options) < 2 ->
        {:error, {:bad_options, q["id"]}}

      not is_list(answer) or answer == [] ->
        {:error, {:bad_answer, q["id"]}}

      Enum.any?(answer, fn i -> not is_integer(i) or i < 0 or i >= length(options) end) ->
        {:error, {:bad_answer, q["id"]}}

      true ->
        :ok
    end
  end

  defp check_shape(%{"type" => "short_answer"}), do: :ok

  defp extract_questions(%{"questions" => questions}) when is_list(questions),
    do: {:ok, questions}

  defp extract_questions(%{questions: questions}) when is_list(questions), do: {:ok, questions}
  defp extract_questions(list) when is_list(list), do: {:ok, list}
  defp extract_questions(_), do: {:error, :no_questions}

  defp learner_state_to_input(nil), do: nil

  defp learner_state_to_input(%LearnerState{} = ls) do
    %{
      understanding_score: ls.understanding_score,
      known_concepts: ls.known_concepts,
      misconceptions: ls.misconceptions,
      recent_errors: ls.recent_errors,
      preferred_style: ls.preferred_style
    }
  end
end
