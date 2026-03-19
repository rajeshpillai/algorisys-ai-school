import { createSignal, createResource, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import MarkdownContent from '../components/content/markdown-content';
import { api } from '../lib/api-client';

type Tab = 'content' | 'discussion' | 'quiz' | 'playground';

export default function LessonPage() {
  const params = useParams<{ courseId: string; moduleId: string; lessonId: string }>();
  const [activeTab, setActiveTab] = createSignal<Tab>('content');

  const [lesson] = createResource(
    () => params.lessonId,
    async (id) => {
      setActiveTab('content');
      const res = await api.getLesson(id) as any;
      return res.lesson;
    }
  );

  const tabs = () => {
    const l = lesson();
    if (!l) return [];
    const t: { id: Tab; label: string }[] = [{ id: 'content', label: 'Content' }];
    if (l.discussion_prompt) t.push({ id: 'discussion', label: 'Discussion' });
    if (l.quiz_content) t.push({ id: 'quiz', label: 'Quiz' });
    if (l.playground_code) t.push({ id: 'playground', label: 'Playground' });
    return t;
  };

  return (
    <div class="lp-panel">
      <Show when={lesson.loading}>
        <div class="lp-loading">Loading lesson...</div>
      </Show>

      <Show when={lesson.error}>
        <div class="lp-error">Lesson not found.</div>
      </Show>

      <Show when={lesson()}>
        {(l) => (
          <>
            <header class="lp-header">
              <h1 class="lp-title">{l().title}</h1>
              <div class="lp-meta-bar">
                <span class="lp-difficulty">{l().difficulty}</span>
                <span class="lp-time">{l().estimated_minutes} min</span>
              </div>

              <div class="lp-tabs">
                {tabs().map((tab) => (
                  <button
                    class={`lp-tab ${activeTab() === tab.id ? 'lp-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            <div class="lp-content">
              <Show when={activeTab() === 'content' && l().slide_content}>
                <MarkdownContent content={l().slide_content} />
              </Show>

              <Show when={activeTab() === 'discussion' && l().discussion_prompt}>
                <h2 class="panel-title">Discussion</h2>
                <p class="discussion-prompt">{l().discussion_prompt}</p>
                <p class="discussion-hint">
                  The AI classroom will facilitate this discussion with multiple agents.
                  This feature is coming soon.
                </p>
              </Show>

              <Show when={activeTab() === 'quiz' && l().quiz_content}>
                <h2 class="panel-title">Quiz</h2>
                <MarkdownContent content={l().quiz_content} />
              </Show>

              <Show when={activeTab() === 'playground' && l().playground_code}>
                <h2 class="panel-title">Playground</h2>
                <div class="code-block">
                  <MarkdownContent content={l().playground_code} />
                </div>
                <Show when={l().playground_solution}>
                  <details class="solution-details">
                    <summary class="solution-summary">Show Solution</summary>
                    <div class="code-block">
                      <MarkdownContent content={l().playground_solution} />
                    </div>
                  </details>
                </Show>
              </Show>
            </div>
          </>
        )}
      </Show>

      <style>{`
        .lp-panel {
          max-width: 720px;
        }

        .lp-loading, .lp-error {
          padding: 2rem;
          color: var(--text-muted);
        }

        .lp-header {
          padding-bottom: 0;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
        }

        .lp-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .lp-meta-bar {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .lp-difficulty {
          color: var(--accent-color);
          font-weight: 600;
          text-transform: capitalize;
        }

        .lp-time {
          color: var(--text-muted);
        }

        .lp-tabs {
          display: flex;
          gap: 0;
        }

        .lp-tab {
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .lp-tab:hover {
          color: var(--text-primary);
        }

        .lp-tab-active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
          font-weight: 600;
        }

        .lp-content {
          padding: 0;
        }

        .panel-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .discussion-prompt {
          font-size: 1.05rem;
          color: var(--text-primary);
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .discussion-hint {
          color: var(--text-muted);
          font-style: italic;
          font-size: 0.9rem;
        }

        .code-block {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          overflow-x: auto;
        }

        .solution-details {
          margin-top: 1.5rem;
        }

        .solution-summary {
          cursor: pointer;
          color: var(--accent-color);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .solution-summary:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
