import { useParams, useNavigate } from '@solidjs/router';
import { onMount, onCleanup, createEffect, createSignal, Show } from 'solid-js';
import TopBar from '../components/layout/top-bar';
import { ClassroomProvider, useClassroom } from '../context/classroom-context';
import ChatStream from '../components/classroom/chat-stream';
import ParticipantList from '../components/classroom/participant-list';
import UserInput from '../components/classroom/user-input';
import CurriculumProgressBar from '../components/classroom/curriculum-progress';
import AdvancePromptCard from '../components/classroom/advance-prompt';
import QuizCard from '../components/classroom/quiz-card';
import { api } from '../lib/api-client';

function ClassroomContent() {
  const params = useParams<{ sessionId: string }>();
  const classroom = useClassroom();
  const navigate = useNavigate();

  const [copied, setCopied] = createSignal(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const copySession = async () => {
    try {
      await navigator.clipboard.writeText(params.sessionId);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — ignore
    }
    setCopied(true);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => setCopied(false), 1500);
  };

  onCleanup(() => clearTimeout(copyTimer));

  onMount(async () => {
    // Try to resume the GenServer if it's not running (e.g. coming from history)
    try {
      await api.resumeSession(params.sessionId);
    } catch {
      // Session may already be active or may not exist in DB — proceed anyway
    }
    classroom.connect(params.sessionId);
  });

  onCleanup(() => {
    classroom.disconnect();
  });

  // Redirect to landing if init error occurs (before user's first message)
  createEffect(() => {
    const error = classroom.initError();
    if (error) {
      sessionStorage.setItem('classroom_init_error', error);
      classroom.disconnect();
      navigate('/', { replace: true });
    }
  });

  return (
    <>
      <div class="classroom-page">
        <TopBar />
        <CurriculumProgressBar
          progress={classroom.progress()}
          isPaused={classroom.isPaused()}
          onTogglePause={() => classroom.togglePause()}
        />
        <div class="classroom-header">
          <div class="classroom-header-title">
            <span class="classroom-header-eyebrow">
              <span class="classroom-header-dot" aria-hidden="true" />
              Now teaching
            </span>
            <span class="classroom-topic">
              {classroom.progress()?.current_topic || classroom.roundtableTopic() || 'Classroom session'}
            </span>
          </div>
          <button
            class="classroom-session-chip"
            classList={{ 'classroom-session-chip--copied': copied() }}
            onClick={copySession}
            title="Copy full session ID"
          >
            <span class="classroom-session-chip-id">{params.sessionId}</span>
            <span class="classroom-session-chip-action">{copied() ? 'Copied ✓' : 'Copy'}</span>
          </button>
        </div>
        <div class="classroom-layout">
          <div class="classroom-main">
            <Show when={classroom.roundtableActive()}>
              <div class="roundtable-banner">
                <span class="roundtable-banner-label">Panel Discussion</span>
                <span class="roundtable-banner-topic">{classroom.roundtableTopic()}</span>
                <span class="roundtable-banner-participants">
                  {classroom.roundtableParticipants().join(' · ')}
                </span>
              </div>
            </Show>
            <ChatStream
              messages={classroom.messages()}
              streamingAgent={classroom.streamingAgent()}
              streamingContent={classroom.streamingContent()}
              agents={classroom.agents()}
              isProcessing={classroom.isProcessing()}
            />
            <Show when={classroom.activeQuiz()}>
              <QuizCard
                quiz={classroom.activeQuiz()!}
                result={classroom.quizResult()}
                onSubmit={(answers) => classroom.submitQuizAnswers(answers)}
              />
            </Show>
            <Show when={classroom.advancePrompt()}>
              <AdvancePromptCard
                prompt={classroom.advancePrompt()!}
                paused={classroom.isPaused()}
                onContinue={() => classroom.confirmAdvance()}
                onDismiss={() => classroom.dismissAdvance()}
              />
            </Show>
            <UserInput
              onSend={(content) => classroom.send(content)}
              disabled={!!classroom.streamingAgent()}
            />
          </div>
          <div class="classroom-sidebar">
            <ParticipantList
              agents={classroom.agents()}
              activeAgent={classroom.streamingAgent()}
            />
          </div>
        </div>
      </div>

      <style>{`
        .classroom-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
        }

        .classroom-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.6rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .classroom-header-title {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }

        .classroom-header-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-muted);
        }

        .classroom-header-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success-color);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--success-color) 20%, transparent);
        }

        .classroom-topic {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .classroom-session-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          max-width: 16rem;
          padding: 0.3rem 0.4rem 0.3rem 0.7rem;
          border: 1px solid var(--border-color);
          border-radius: 999px;
          background: var(--bg-primary);
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
        }

        .classroom-session-chip:hover {
          border-color: var(--accent-color);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }

        .classroom-session-chip-id {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .classroom-session-chip-action {
          flex-shrink: 0;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.18rem 0.5rem;
          border-radius: 999px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .classroom-session-chip:hover .classroom-session-chip-action {
          background: var(--accent-color);
          color: #fff;
        }

        .classroom-session-chip--copied,
        .classroom-session-chip--copied:hover {
          border-color: var(--success-color);
          color: var(--success-color);
        }

        .classroom-session-chip--copied .classroom-session-chip-action,
        .classroom-session-chip--copied:hover .classroom-session-chip-action {
          background: var(--success-color);
          color: #fff;
        }

        .roundtable-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: var(--accent-color);
          color: white;
          font-size: 0.8rem;
        }

        .roundtable-banner-label {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.4rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .roundtable-banner-topic {
          font-weight: 500;
          flex: 1;
        }

        .roundtable-banner-participants {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .classroom-layout {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .classroom-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .classroom-sidebar {
          width: 220px;
          border-left: 1px solid var(--border-color);
          background: var(--bg-secondary);
          overflow-y: auto;
        }
      `}</style>
    </>
  );
}

export default function ClassroomPage() {
  return (
    <ClassroomProvider>
      <ClassroomContent />
    </ClassroomProvider>
  );
}
