import { A } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';

export default function NotFound() {
  return (
    <div class="not-found-page">
      <TopBar />
      <div class="not-found-content">
        <h1 class="not-found-code">404</h1>
        <p class="not-found-message">Page not found</p>
        <A href="/" class="not-found-link">Back to Home</A>
      </div>

      <style>{`
        .not-found-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .not-found-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .not-found-code {
          font-size: 5rem;
          font-weight: 800;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .not-found-message {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .not-found-link {
          padding: 0.75rem 1.5rem;
          background: var(--accent-color);
          color: white !important;
          border-radius: 8px;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .not-found-link:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </div>
  );
}
