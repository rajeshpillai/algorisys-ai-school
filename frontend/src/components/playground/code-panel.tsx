import type { Component } from 'solid-js';

interface CodePanelProps {
  code: string;
  onChange?: (code: string) => void;
}

const CodePanel: Component<CodePanelProps> = (props) => {
  return (
    <>
      <div class="code-panel">
        <div class="code-panel-header">
          <span class="code-panel-label">Code Editor</span>
        </div>
        <textarea
          class="code-panel-editor"
          value={props.code}
          onInput={(e) => props.onChange?.(e.currentTarget.value)}
          spellcheck={false}
        />
      </div>

      <style>{`
        .code-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .code-panel-header {
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }

        .code-panel-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .code-panel-editor {
          flex: 1;
          padding: 1rem;
          font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: none;
          outline: none;
          resize: none;
          tab-size: 4;
        }
      `}</style>
    </>
  );
};

export default CodePanel;
