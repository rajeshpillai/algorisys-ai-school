import { createSignal, For, Show, type Component } from 'solid-js';
import type { QuizData, QuizAnswer, QuizGradeResult } from '../../lib/quiz-types';

interface QuizCardProps {
  quiz: QuizData;
  onSubmit: (answers: QuizAnswer[]) => void;
  result?: QuizGradeResult | null;
}

const QuizCard: Component<QuizCardProps> = (props) => {
  const [answers, setAnswers] = createSignal<Record<string, string | number | number[]>>({});
  const [submitted, setSubmitted] = createSignal(false);

  const setAnswer = (questionId: string, value: string | number | number[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const quizAnswers: QuizAnswer[] = props.quiz.questions.map((q) => ({
      question_id: q.id,
      answer: answers()[q.id] ?? '',
    }));
    setSubmitted(true);
    props.onSubmit(quizAnswers);
  };

  const allAnswered = () =>
    props.quiz.questions.every((q) => {
      const a = answers()[q.id];
      return a !== undefined && a !== '';
    });

  const getResult = (questionId: string) =>
    props.result?.results.find((r) => r.question_id === questionId);

  return (
    <>
      <div class="quiz-card">
        <div class="quiz-card-header">
          <span class="quiz-card-label">Quiz</span>
          <span class="quiz-card-topic">{props.quiz.topic}</span>
          <span class="quiz-card-count">
            {props.quiz.questions.length} questions
          </span>
        </div>

        <div class="quiz-card-body">
          <For each={props.quiz.questions}>
            {(q, idx) => {
              const result = () => getResult(q.id);
              return (
                <div
                  class="quiz-question"
                  classList={{
                    'quiz-question-correct': !!result()?.correct,
                    'quiz-question-wrong': result() ? !result()!.correct : false,
                  }}
                >
                  <div class="quiz-question-text">
                    <span class="quiz-question-num">{idx() + 1}.</span>
                    {q.question}
                  </div>

                  <Show when={q.type === 'single' && q.options}>
                    <div class="quiz-options">
                      <For each={q.options}>
                        {(opt, optIdx) => (
                          <label
                            class="quiz-option"
                            classList={{
                              'quiz-option-selected': answers()[q.id] === optIdx(),
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={optIdx()}
                              checked={answers()[q.id] === optIdx()}
                              onChange={() => setAnswer(q.id, optIdx())}
                              disabled={submitted()}
                            />
                            <span class="quiz-option-text">{opt}</span>
                          </label>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={q.type === 'multiple' && q.options}>
                    <div class="quiz-options">
                      <For each={q.options}>
                        {(opt, optIdx) => {
                          const selected = () => {
                            const a = answers()[q.id];
                            return Array.isArray(a) && a.includes(optIdx());
                          };
                          return (
                            <label
                              class="quiz-option"
                              classList={{ 'quiz-option-selected': selected() }}
                            >
                              <input
                                type="checkbox"
                                checked={selected()}
                                onChange={() => {
                                  const current = (answers()[q.id] as number[]) || [];
                                  const next = selected()
                                    ? current.filter((i) => i !== optIdx())
                                    : [...current, optIdx()];
                                  setAnswer(q.id, next);
                                }}
                                disabled={submitted()}
                              />
                              <span class="quiz-option-text">{opt}</span>
                            </label>
                          );
                        }}
                      </For>
                    </div>
                  </Show>

                  <Show when={q.type === 'short_answer'}>
                    <input
                      type="text"
                      class="quiz-text-input"
                      placeholder="Type your answer..."
                      value={(answers()[q.id] as string) || ''}
                      onInput={(e) => setAnswer(q.id, e.currentTarget.value)}
                      disabled={submitted()}
                    />
                  </Show>

                  <Show when={result()}>
                    <div class="quiz-feedback">
                      <span class="quiz-feedback-score">
                        {result()!.score}/{result()!.max_points}
                      </span>
                      <span class="quiz-feedback-text">{result()!.feedback}</span>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <div class="quiz-card-footer">
          <Show
            when={!props.result}
            fallback={
              <div class="quiz-result-summary">
                <span class="quiz-result-score">
                  Score: {props.result!.total_score}/{props.result!.total_points}
                </span>
                <span class="quiz-result-percent">({props.result!.percent}%)</span>
              </div>
            }
          >
            <button
              class="quiz-submit-btn"
              onClick={handleSubmit}
              disabled={submitted() || !allAnswered()}
            >
              {submitted() ? 'Grading...' : 'Submit Answers'}
            </button>
          </Show>
        </div>
      </div>

      <style>{`
        .quiz-card {
          margin: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .quiz-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .quiz-card-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          background: var(--accent-color);
          color: white;
          font-weight: 600;
        }

        .quiz-card-topic {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          flex: 1;
        }

        .quiz-card-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .quiz-card-body {
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .quiz-question {
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .quiz-question-correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .quiz-question-wrong {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .quiz-question-text {
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 0.6rem;
          line-height: 1.5;
        }

        .quiz-question-num {
          font-weight: 600;
          margin-right: 0.3rem;
          color: var(--text-muted);
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .quiz-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.6rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .quiz-option:hover:not(:has(input:disabled)) {
          border-color: var(--accent-color);
        }

        .quiz-option-selected {
          border-color: var(--accent-color);
          background: rgba(99, 102, 241, 0.08);
        }

        .quiz-option-text {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .quiz-text-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.85rem;
          background: var(--bg-primary);
          color: var(--text-primary);
          outline: none;
          box-sizing: border-box;
        }

        .quiz-text-input:focus {
          border-color: var(--accent-color);
        }

        .quiz-feedback {
          margin-top: 0.5rem;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          font-size: 0.8rem;
        }

        .quiz-feedback-score {
          font-weight: 600;
          color: var(--text-primary);
        }

        .quiz-feedback-text {
          color: var(--text-secondary);
        }

        .quiz-card-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
        }

        .quiz-submit-btn {
          padding: 0.5rem 1.5rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .quiz-submit-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .quiz-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quiz-result-summary {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .quiz-result-score {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .quiz-result-percent {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
};

export default QuizCard;
