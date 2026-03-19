import { A } from '@solidjs/router';
import ThemeToggle from './theme-toggle';

export default function TopBar() {
  return (
    <>
      <header class="top-bar">
        <A href="/" class="top-bar-brand">Algorisys Open AI School</A>
        <div class="top-bar-actions">
          <ThemeToggle />
        </div>
      </header>

      <style>{`
        .top-bar {
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-primary);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .top-bar-brand {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary) !important;
          letter-spacing: -0.01em;
        }

        .top-bar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
    </>
  );
}
