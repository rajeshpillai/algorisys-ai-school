import { createSignal, createResource, For, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';
import { api } from '../lib/api-client';
import type { SessionSummary } from '../lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    initializing: 'Starting',
    teaching: 'Active',
    waiting: 'Waiting',
    awaiting_advance: 'Ready to advance',
  };
  return labels[state] || state;
}

export default function SessionHistory() {
  const navigate = useNavigate();
  const [sessions] = createResource(async () => {
    const data = await api.getSessions() as { sessions: SessionSummary[] };
    return data.sessions;
  });

  const handleResume = async (sessionId: string) => {
    try {
      await api.resumeSession(sessionId);
    } catch {
      // Session may already be active — navigate anyway
    }
    navigate(`/classroom/${sessionId}`);
  };

  return (
    <>
      <TopBar />
      <div class="history-container">
        <div class="history-header">
          <h1 class="history-title">Your Sessions</h1>
          <A href="/" class="history-new-btn">New Session</A>
        </div>

        <Show when={sessions.loading}>
          <div class="history-loading">Loading sessions...</div>
        </Show>

        <Show when={sessions.error}>
          <div class="history-empty">Failed to load sessions.</div>
        </Show>

        <Show when={sessions() && sessions()!.length === 0}>
          <div class="history-empty">
            <p>No sessions yet.</p>
            <A href="/">Start learning something new</A>
          </div>
        </Show>

        <Show when={sessions() && sessions()!.length > 0}>
          <div class="history-list">
            <For each={sessions()}>
              {(session) => (
                <button class="history-card" onClick={() => handleResume(session.id)}>
                  <div class="history-card-main">
                    <div class="history-card-goal">{session.goal}</div>
                    <Show when={session.current_topic}>
                      <div class="history-card-topic">{session.current_topic}</div>
                    </Show>
                  </div>
                  <div class="history-card-meta">
                    <span class="history-card-badge">{stateLabel(session.state)}</span>
                    <span class="history-card-stat">{session.agent_count} agents</span>
                    <span class="history-card-stat">{session.message_count} messages</span>
                    <span class="history-card-time">{timeAgo(session.last_activity)}</span>
                  </div>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <style>{`
        .history-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .history-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .history-new-btn {
          padding: 0.45rem 1rem;
          background: var(--accent-color);
          color: white !important;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }

        .history-new-btn:hover {
          background: var(--accent-hover);
        }

        .history-loading {
          text-align: center;
          color: var(--text-muted);
          padding: 3rem;
        }

        .history-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 3rem;
          font-size: 0.9rem;
        }

        .history-empty a {
          color: var(--accent-color);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .history-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          text-align: left;
          width: 100%;
          font-family: inherit;
          font-size: inherit;
          color: inherit;
        }

        .history-card:hover {
          border-color: var(--accent-color);
          background: var(--bg-secondary);
        }

        .history-card-main {
          flex: 1;
          min-width: 0;
        }

        .history-card-goal {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-card-topic {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-card-meta {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .history-card-badge {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: var(--accent-color);
          color: white;
          opacity: 0.85;
        }

        .history-card-stat {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .history-card-time {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
