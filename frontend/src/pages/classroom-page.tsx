import { useParams } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';
import { ClassroomProvider } from '../context/classroom-context';

export default function ClassroomPage() {
  const params = useParams<{ sessionId: string }>();

  return (
    <ClassroomProvider>
      <div class="page-container">
        <TopBar />
        <div class="page-content">
          <h1 class="page-title">Classroom</h1>
          <p class="page-subtitle">Session: {params.sessionId}</p>
          <p class="page-placeholder">
            The interactive classroom with AI agents will appear here.
          </p>
        </div>

        <style>{`
          .page-container {
            min-height: 100vh;
            background: var(--bg-primary);
          }

          .page-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
          }

          .page-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
          }

          .page-subtitle {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
          }

          .page-placeholder {
            color: var(--text-muted);
            font-style: italic;
          }
        `}</style>
      </div>
    </ClassroomProvider>
  );
}
