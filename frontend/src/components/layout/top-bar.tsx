import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import ThemeToggle from './theme-toggle';
import SettingsModal from '../common/settings-modal';
import { hasLlmSettings } from '../../lib/llm-settings';

export default function TopBar() {
  const [showSettings, setShowSettings] = createSignal(false);

  return (
    <>
      <header class="top-bar">
        <div class="top-bar-brand-group">
          <A href="/" class="top-bar-brand">Algorisys Open AI School</A>
          <span class="top-bar-tagline">Learn anything from first principles</span>
        </div>
        <div class="top-bar-actions">
          <A href="/history" class="top-bar-history-link">History</A>
          <button
            class="top-bar-settings-btn"
            onClick={() => setShowSettings(true)}
            title="LLM Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <Show when={hasLlmSettings()}>
              <span class="top-bar-settings-dot" />
            </Show>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <Show when={showSettings()}>
        <SettingsModal onClose={() => setShowSettings(false)} />
      </Show>

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

        .top-bar-brand-group {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        .top-bar-brand {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary) !important;
          letter-spacing: -0.01em;
        }

        .top-bar-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 400;
          letter-spacing: 0.02em;
          opacity: 0.7;
        }

        .top-bar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .top-bar-history-link {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary) !important;
          text-decoration: none;
          transition: color 0.15s;
        }

        .top-bar-history-link:hover {
          color: var(--text-primary) !important;
        }

        .top-bar-settings-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 6px;
          transition: color 0.2s;
        }

        .top-bar-settings-btn:hover {
          color: var(--text-primary);
        }

        .top-bar-settings-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-color);
        }
      `}</style>
    </>
  );
}
