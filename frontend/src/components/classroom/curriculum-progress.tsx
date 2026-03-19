import { Show, type Component } from 'solid-js';
import type { CurriculumProgress } from '../../lib/types';

interface CurriculumProgressBarProps {
  progress: CurriculumProgress | null;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const CurriculumProgressBar: Component<CurriculumProgressBarProps> = (props) => {
  const percent = () => {
    const p = props.progress;
    if (!p || p.total_lessons === 0) return 0;
    return Math.round((p.completed_lessons / p.total_lessons) * 100);
  };

  return (
    <>
      <Show when={props.progress && props.progress.total_lessons > 0}>
        <div class="curriculum-progress">
          <div class="curriculum-progress-info">
            <div class="curriculum-progress-left">
              <Show when={props.onTogglePause}>
                <button
                  class="curriculum-pause-btn"
                  onClick={() => props.onTogglePause?.()}
                  title={props.isPaused ? 'Resume auto-advance' : 'Pause auto-advance'}
                >
                  <Show when={props.isPaused} fallback={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  }>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  </Show>
                </button>
              </Show>
              <span class="curriculum-progress-topic">{props.progress!.current_topic}</span>
            </div>
            <span class="curriculum-progress-count">
              {props.progress!.completed_lessons}/{props.progress!.total_lessons} lessons
              <Show when={props.isPaused}>
                <span class="curriculum-paused-badge">paused</span>
              </Show>
            </span>
          </div>
          <div class="curriculum-progress-bar">
            <div
              class="curriculum-progress-fill"
              style={{ width: `${percent()}%` }}
            />
          </div>
        </div>
      </Show>

      <style>{`
        .curriculum-progress {
          padding: 0.4rem 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .curriculum-progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.3rem;
        }

        .curriculum-progress-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          max-width: 70%;
        }

        .curriculum-pause-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.2s, border-color 0.2s;
        }

        .curriculum-pause-btn:hover {
          color: var(--accent-color);
          border-color: var(--accent-color);
        }

        .curriculum-progress-topic {
          font-size: 0.8rem;
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .curriculum-progress-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .curriculum-paused-badge {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          background: var(--text-muted);
          color: var(--bg-primary);
          font-weight: 600;
        }

        .curriculum-progress-bar {
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          overflow: hidden;
        }

        .curriculum-progress-fill {
          height: 100%;
          background: var(--accent-color);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
      `}</style>
    </>
  );
};

export default CurriculumProgressBar;
