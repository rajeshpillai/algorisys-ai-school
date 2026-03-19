import { Show, type Component } from 'solid-js';
import type { CurriculumProgress } from '../../lib/types';

interface CurriculumProgressBarProps {
  progress: CurriculumProgress | null;
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
            <span class="curriculum-progress-topic">{props.progress!.current_topic}</span>
            <span class="curriculum-progress-count">
              {props.progress!.completed_lessons}/{props.progress!.total_lessons} lessons
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

        .curriculum-progress-topic {
          font-size: 0.8rem;
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 70%;
        }

        .curriculum-progress-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          flex-shrink: 0;
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
