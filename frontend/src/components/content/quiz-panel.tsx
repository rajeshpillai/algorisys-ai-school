import type { Component } from 'solid-js';

interface QuizPanelProps {
  content: string;
}

const QuizPanel: Component<QuizPanelProps> = (props) => {
  return (
    <>
      <div class="quiz-panel">
        <h3 class="quiz-panel-title">Quiz</h3>
        <div class="quiz-panel-content">{props.content}</div>
      </div>

      <style>{`
        .quiz-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .quiz-panel-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .quiz-panel-content {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </>
  );
};

export default QuizPanel;
