import { createResource, createMemo, For, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';
import LessonPage from './lesson-page';
import { api } from '../lib/api-client';

export default function CourseBrowser() {
  const params = useParams<{ courseId: string; moduleId?: string; lessonId?: string }>();
  const navigate = useNavigate();

  const [course] = createResource(
    () => params.courseId,
    async (id) => {
      const res = await api.getCourse(id) as any;
      return res.course;
    }
  );

  const hasLesson = createMemo(() => !!params.lessonId);

  return (
    <div class="course-page">
      <TopBar />

      <Show when={course.loading}>
        <div class="course-loading">Loading course...</div>
      </Show>

      <Show when={course.error}>
        <div class="course-error">Course not found.</div>
      </Show>

      <Show when={course()}>
        {(c) => (
          <div class="course-layout">
            <aside class="course-sidebar">
              <div class="sidebar-header">
                <h2 class="sidebar-title">{c().title}</h2>
                <p class="sidebar-desc">{c().description}</p>
              </div>

              <nav class="module-nav">
                <For each={c().modules}>
                  {(mod: any) => (
                    <div class="module-group">
                      <h3 class="module-title">
                        {mod.sequence}. {mod.title}
                      </h3>
                      <ul class="lesson-list">
                        <For each={mod.lessons}>
                          {(lesson: any) => (
                            <li
                              class={`lesson-item ${params.lessonId === lesson.id ? 'lesson-item-active' : ''}`}
                              onClick={() =>
                                navigate(`/courses/${params.courseId}/${mod.id}/${lesson.id}`)
                              }
                            >
                              <span class="lesson-seq">{lesson.sequence}</span>
                              <span class="lesson-title">{lesson.title}</span>
                              <span class="lesson-meta">
                                {lesson.estimated_minutes}m
                              </span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  )}
                </For>
              </nav>
            </aside>

            <main class="course-main">
              <Show when={hasLesson()}>
                <LessonPage />
              </Show>

              <Show when={!hasLesson()}>
                <div class="course-overview">
                  <h1 class="overview-title">{c().title}</h1>
                  <p class="overview-desc">{c().description}</p>

                  <div class="overview-stats">
                    <div class="stat">
                      <span class="stat-value">{c().modules.length}</span>
                      <span class="stat-label">Modules</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">
                        {c().modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)}
                      </span>
                      <span class="stat-label">Lessons</span>
                    </div>
                    <Show when={c().language}>
                      <div class="stat">
                        <span class="stat-value">{c().language}</span>
                        <span class="stat-label">Language</span>
                      </div>
                    </Show>
                  </div>

                  <h2 class="overview-section-title">Modules</h2>
                  <For each={c().modules}>
                    {(mod: any) => (
                      <div class="module-card">
                        <h3 class="module-card-title">
                          {mod.sequence}. {mod.title}
                        </h3>
                        <div class="module-card-lessons">
                          <For each={mod.lessons}>
                            {(lesson: any) => (
                              <div
                                class="lesson-card"
                                onClick={() =>
                                  navigate(`/courses/${params.courseId}/${mod.id}/${lesson.id}`)
                                }
                              >
                                <div class="lesson-card-header">
                                  <span class="lesson-card-title">{lesson.title}</span>
                                  <span class="lesson-card-difficulty">{lesson.difficulty}</span>
                                </div>
                                <div class="lesson-card-tags">
                                  <For each={lesson.activity_types}>
                                    {(tag: string) => (
                                      <span class="activity-tag">{tag}</span>
                                    )}
                                  </For>
                                  <span class="lesson-card-time">{lesson.estimated_minutes} min</span>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </main>
          </div>
        )}
      </Show>

      <style>{`
        .course-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .course-loading, .course-error {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .course-layout {
          display: flex;
          min-height: calc(100vh - var(--topbar-height));
        }

        .course-sidebar {
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          padding: 1.5rem;
          overflow-y: auto;
          height: calc(100vh - var(--topbar-height));
          position: sticky;
          top: var(--topbar-height);
        }

        .sidebar-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .sidebar-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .module-group {
          margin-bottom: 1.25rem;
        }

        .module-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .lesson-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 0.85rem;
        }

        .lesson-item:hover {
          background: var(--bg-tertiary);
        }

        .lesson-item-active {
          background: var(--accent-color);
        }

        .lesson-item-active .lesson-seq,
        .lesson-item-active .lesson-title,
        .lesson-item-active .lesson-meta {
          color: white;
        }

        .lesson-seq {
          color: var(--text-muted);
          font-size: 0.75rem;
          min-width: 1.25rem;
        }

        .lesson-title {
          color: var(--text-primary);
          flex: 1;
        }

        .lesson-meta {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .course-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .course-overview {
          max-width: 720px;
        }

        .overview-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .overview-desc {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .overview-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1rem 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--accent-color);
          text-transform: capitalize;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .overview-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .module-card {
          margin-bottom: 1.5rem;
        }

        .module-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .module-card-lessons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .lesson-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .lesson-card:hover {
          border-color: var(--accent-color);
        }

        .lesson-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .lesson-card-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .lesson-card-difficulty {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .lesson-card-tags {
          display: flex;
          gap: 0.4rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .activity-tag {
          padding: 0.15rem 0.5rem;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border-radius: 4px;
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 500;
        }

        .lesson-card-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}
