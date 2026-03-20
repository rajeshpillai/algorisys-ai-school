import { createSignal, createResource, onMount, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';
import { api } from '../lib/api-client';
import { getLlmPayload } from '../lib/llm-settings';

const subjectIcons: Record<string, { icon: string; color: string }> = {
  programming: { icon: '{ }', color: '#3b82f6' },
  mathematics: { icon: 'π', color: '#8b5cf6' },
  history: { icon: '⌛', color: '#f59e0b' },
  science: { icon: '⚛', color: '#22c55e' },
};

const defaultIcon = { icon: '📚', color: '#6366f1' };

export default function Landing() {
  const [goal, setGoal] = createSignal('');
  const [initError, setInitError] = createSignal<string | null>(null);
  const navigate = useNavigate();

  onMount(() => {
    const err = sessionStorage.getItem('classroom_init_error');
    if (err) {
      setInitError(err);
      sessionStorage.removeItem('classroom_init_error');
    }
  });

  const [data] = createResource(async () => {
    const res = await api.getSubjects() as any;
    return res.subjects || [];
  });

  const handleStart = async () => {
    const text = goal().trim();
    if (!text) return;
    setInitError(null);
    try {
      const res = await api.startClassroom(text, undefined, getLlmPayload()) as any;
      navigate(`/classroom/${res.session_id}`);
    } catch (err) {
      setInitError('Failed to start session. Please try again.');
    }
  };

  return (
    <div class="landing-page">
      <TopBar />

      <section class="hero-section">
        <h1 class="hero-title">Algorisys Open AI School</h1>
        <p class="hero-subtitle">
          Learn any subject with a team of AI agents who teach, quiz, and
          guide you through interactive lessons.
        </p>

        <Show when={initError()}>
          <div class="init-error-banner">
            <span>{initError()}</span>
            <button class="init-error-dismiss" onClick={() => setInitError(null)}>&times;</button>
          </div>
        </Show>

        <div class="goal-input-group">
          <input
            type="text"
            class="goal-input"
            placeholder="e.g. Teach me calculus in 6 hours"
            value={goal()}
            onInput={(e) => setGoal(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button class="start-button" onClick={handleStart}>
            Start Learning
          </button>
        </div>
      </section>

      <section class="subjects-section">
        <h2 class="subjects-heading">Explore Courses</h2>

        <Show when={data.loading}>
          <p class="loading-text">Loading courses...</p>
        </Show>

        <Show when={!data.loading && data()}>
          <For each={data()}>
            {(subject: any) => {
              const info = subjectIcons[subject.subject] || defaultIcon;
              return (
                <div class="subject-group">
                  <div class="subject-group-header">
                    <span class="subject-group-icon" style={{ 'background-color': info.color + '20', color: info.color }}>
                      {info.icon}
                    </span>
                    <h3 class="subject-group-title">{subject.subject}</h3>
                  </div>
                  <div class="courses-grid">
                    <For each={subject.courses}>
                      {(course: any) => (
                        <div
                          class="course-card"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <h4 class="course-card-title">{course.title}</h4>
                          <p class="course-card-desc">{course.description}</p>
                          <Show when={course.language}>
                            <span class="course-card-tag">{course.language}</span>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              );
            }}
          </For>
        </Show>
      </section>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          max-width: 720px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2.5rem;
          max-width: 560px;
        }

        .init-error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          width: 100%;
          max-width: 560px;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #991b1b;
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }

        .dark .init-error-banner {
          background: #450a0a;
          border-color: #7f1d1d;
          color: #fca5a5;
        }

        .init-error-dismiss {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0 0.25rem;
          opacity: 0.7;
        }

        .init-error-dismiss:hover {
          opacity: 1;
        }

        .goal-input-group {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          max-width: 560px;
        }

        .goal-input {
          flex: 1;
          padding: 0.85rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          font-size: 1rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }

        .goal-input:focus {
          border-color: var(--accent-color);
        }

        .goal-input::placeholder {
          color: var(--text-muted);
        }

        .start-button {
          padding: 0.85rem 1.75rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .start-button:hover {
          background: var(--accent-hover);
        }

        .subjects-section {
          max-width: 960px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
        }

        .subjects-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .loading-text {
          text-align: center;
          color: var(--text-muted);
        }

        .subject-group {
          margin-bottom: 2rem;
        }

        .subject-group-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .subject-group-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .subject-group-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .course-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .course-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .course-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .course-card-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .course-card-tag {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          background: var(--accent-color);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
