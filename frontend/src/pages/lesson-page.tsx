import { createSignal, createResource, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';
import MarkdownContent from '../components/content/markdown-content';
import { api } from '../lib/api-client';

type Tab = 'content' | 'discussion' | 'quiz' | 'playground';

export default function LessonPage() {
  const params = useParams<{ courseId: string; moduleId: string; lessonId: string }>();
  const [activeTab, setActiveTab] = createSignal<Tab>('content');

  const [lesson] = createResource(
    () => params.lessonId,
    async (id) => {
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
    <div class="lesson-page">
      <TopBar />

      <Show when={lesson.loading}>
        <div class="lesson-loading">Loading lesson...</div>
      </Show>

      <Show when={lesson.error}>
        <div class="lesson-error">Lesson not found.</div>
      </Show>

      <Show when={lesson()}>
        {(l) => (
          <div class="lesson-layout">
            <header class="lesson-header">
              <div class="lesson-header-content">
                <div class="lesson-breadcrumb">
                  <a href={`/courses/${params.courseId}`} class="breadcrumb-link">
                    {params.courseId}
                  </a>
                  <span class="breadcrumb-sep">/</span>
                  <span class="breadcrumb-current">{l().title}</span>
                </div>
                <h1 class="lesson-title">{l().title}</h1>
                <div class="lesson-meta-bar">
                  <span class="lesson-difficulty">{l().difficulty}</span>
                  <span class="lesson-time">{l().estimated_minutes} min</span>
                </div>
              </div>

              <div class="lesson-tabs">
                {tabs().map((tab) => (
                  <button
                    class={`lesson-tab ${activeTab() === tab.id ? 'lesson-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            <main class="lesson-content">
              <Show when={activeTab() === 'content' && l().slide_content}>
                <div class="content-panel">
                  <MarkdownContent content={l().slide_content} />
                </div>
              </Show>

              <Show when={activeTab() === 'discussion' && l().discussion_prompt}>
                <div class="content-panel">
                  <h2 class="panel-title">Discussion</h2>
                  <p class="discussion-prompt">{l().discussion_prompt}</p>
                  <p class="discussion-hint">
                    The AI classroom will facilitate this discussion with multiple agents.
                    This feature is coming soon.
                  </p>
                </div>
              </Show>

              <Show when={activeTab() === 'quiz' && l().quiz_content}>
                <div class="content-panel">
                  <h2 class="panel-title">Quiz</h2>
                  <MarkdownContent content={l().quiz_content} />
                </div>
              </Show>

              <Show when={activeTab() === 'playground' && l().playground_code}>
                <div class="content-panel">
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
                </div>
              </Show>
            </main>
          </div>
        )}
      </Show>

      <style>{`
        .lesson-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .lesson-loading, .lesson-error {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .lesson-layout {
          max-width: 860px;
          margin: 0 auto;
        }

        .lesson-header {
          padding: 1.5rem 1.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .lesson-header-content {
          margin-bottom: 1rem;
        }

        .lesson-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .breadcrumb-link {
          color: var(--accent-color);
          text-decoration: none;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: var(--text-muted);
        }

        .breadcrumb-current {
          color: var(--text-secondary);
        }

        .lesson-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .lesson-meta-bar {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
        }

        .lesson-difficulty {
          color: var(--accent-color);
          font-weight: 600;
          text-transform: capitalize;
        }

        .lesson-time {
          color: var(--text-muted);
        }

        .lesson-tabs {
          display: flex;
          gap: 0;
        }

        .lesson-tab {
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

        .lesson-tab:hover {
          color: var(--text-primary);
        }

        .lesson-tab-active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
          font-weight: 600;
        }

        .lesson-content {
          padding: 2rem 1.5rem;
        }

        .content-panel {
          max-width: 100%;
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
