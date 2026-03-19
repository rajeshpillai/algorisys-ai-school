import type { Component } from 'solid-js';

interface OutputPanelProps {
  output: string;
  isError?: boolean;
}

const OutputPanel: Component<OutputPanelProps> = (props) => {
  return (
    <>
      <div class="output-panel">
        <div class="output-panel-header">
          <span class="output-panel-label">Output</span>
        </div>
        <pre
          class="output-panel-content"
          classList={{ 'output-error': props.isError }}
        >
          {props.output || 'Run your code to see output here.'}
        </pre>
      </div>

      <style>{`
        .output-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .output-panel-header {
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }

        .output-panel-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .output-panel-content {
          flex: 1;
          padding: 1rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
          color: var(--text-secondary);
          overflow: auto;
          margin: 0;
          white-space: pre-wrap;
        }

        .output-error {
          color: var(--error-color);
        }
      `}</style>
    </>
  );
};

export default OutputPanel;
