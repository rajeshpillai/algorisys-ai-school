import type { Component } from 'solid-js';

interface PlaygroundTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const PlaygroundTab: Component<PlaygroundTabProps> = (props) => {
  return (
    <>
      <button
        class="playground-tab"
        classList={{ 'playground-tab-active': props.active }}
        onClick={props.onClick}
      >
        {props.label}
      </button>

      <style>{`
        .playground-tab {
          padding: 0.4rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .playground-tab:hover {
          color: var(--text-primary);
        }

        .playground-tab-active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
        }
      `}</style>
    </>
  );
};

export default PlaygroundTab;
