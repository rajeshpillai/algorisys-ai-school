import { useParams } from '@solidjs/router';
import { onMount, onCleanup, Show } from 'solid-js';
import TopBar from '../components/layout/top-bar';
import { ClassroomProvider, useClassroom } from '../context/classroom-context';
import ChatStream from '../components/classroom/chat-stream';
import ParticipantList from '../components/classroom/participant-list';
import UserInput from '../components/classroom/user-input';
import CurriculumProgressBar from '../components/classroom/curriculum-progress';
import AdvancePromptCard from '../components/classroom/advance-prompt';

function ClassroomContent() {
  const params = useParams<{ sessionId: string }>();
  const classroom = useClassroom();

  onMount(() => {
    classroom.connect(params.sessionId);
  });

  onCleanup(() => {
    classroom.disconnect();
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
          <span class="classroom-session-label">Session: {params.sessionId}</span>
        </div>
        <div class="classroom-layout">
          <div class="classroom-main">
            <ChatStream
              messages={classroom.messages()}
              streamingAgent={classroom.streamingAgent()}
              streamingContent={classroom.streamingContent()}
              agents={classroom.agents()}
            />
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
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .classroom-session-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-family: monospace;
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
