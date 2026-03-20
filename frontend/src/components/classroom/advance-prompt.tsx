import { type Component } from 'solid-js';
import type { AdvancePrompt } from '../../lib/types';

interface AdvancePromptCardProps {
  prompt: AdvancePrompt;
  paused: boolean;
  onContinue: () => void;
  onDismiss: () => void;
}

const AdvancePromptCard: Component<AdvancePromptCardProps> = (props) => {
  return (
    <>
      <div class="advance-prompt-card">
        <div class="advance-prompt-body">
          <div class="advance-prompt-text">
            <span class="advance-prompt-label">Up next</span>
            <span class="advance-prompt-topic">{props.prompt.next_topic}</span>
            <span class="advance-prompt-count">
              Lesson {props.prompt.completed_lessons + 1} of {props.prompt.total_lessons}
            </span>
          </div>
          <div class="advance-prompt-actions">
            <button class="advance-prompt-continue" onClick={() => props.onContinue()}>
              Continue
            </button>
            <button class="advance-prompt-ask" onClick={() => props.onDismiss()}>
              Ask a Question
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .advance-prompt-card {
          margin: 0.75rem 1rem;
          border: 1px solid var(--accent-color);
          border-radius: 10px;
          overflow: hidden;
          background: var(--bg-secondary);
          animation: advance-prompt-slide-in 0.3s ease-out;
        }

        @keyframes advance-prompt-slide-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .advance-prompt-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          gap: 1rem;
        }

        .advance-prompt-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .advance-prompt-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-color);
          font-weight: 600;
        }

        .advance-prompt-topic {
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .advance-prompt-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .advance-prompt-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .advance-prompt-continue {
          padding: 0.45rem 1rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .advance-prompt-continue:hover {
          background: var(--accent-hover);
        }

        .advance-prompt-ask {
          padding: 0.45rem 1rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .advance-prompt-ask:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
        }
      `}</style>
    </>
  );
};

export default AdvancePromptCard;
