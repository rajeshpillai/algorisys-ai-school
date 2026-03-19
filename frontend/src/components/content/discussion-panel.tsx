import type { Component } from 'solid-js';

interface DiscussionPanelProps {
  prompt: string;
}

const DiscussionPanel: Component<DiscussionPanelProps> = (props) => {
  return (
    <>
      <div class="discussion-panel">
        <h3 class="discussion-panel-title">Discussion</h3>
        <p class="discussion-panel-prompt">{props.prompt}</p>
      </div>

      <style>{`
        .discussion-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .discussion-panel-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .discussion-panel-prompt {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </>
  );
};

export default DiscussionPanel;
