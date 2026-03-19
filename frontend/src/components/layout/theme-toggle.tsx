import { useTheme } from '../../context/theme-context';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <button class="theme-toggle" onClick={toggle} title="Toggle theme">
        <span class="theme-toggle-icon">
          {theme() === 'light' ? '\u263E' : '\u2600'}
        </span>
      </button>

      <style>{`
        .theme-toggle {
          width: 36px;
          height: 36px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .theme-toggle:hover {
          background: var(--bg-tertiary);
        }

        .theme-toggle-icon {
          font-size: 1.1rem;
        }
      `}</style>
    </>
  );
}
