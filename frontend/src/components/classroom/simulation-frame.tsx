import { type Component } from 'solid-js';

interface SimulationFrameProps {
  html: string;
}

const SimulationFrame: Component<SimulationFrameProps> = (props) => {
  let iframeRef: HTMLIFrameElement | undefined;

  const handleReset = () => {
    if (iframeRef) {
      iframeRef.srcdoc = props.html;
    }
  };

  return (
    <>
      <div class="simulation-frame">
        <div class="simulation-frame-header">
          <span class="simulation-frame-label">Interactive Simulation</span>
          <button class="simulation-frame-reset" onClick={handleReset}>Reset</button>
        </div>
        <iframe
          ref={iframeRef}
          srcdoc={props.html}
          sandbox="allow-scripts"
          class="simulation-frame-iframe"
          title="Interactive simulation"
        />
      </div>

      <style>{`
        .simulation-frame {
          margin: 0.75rem 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .simulation-frame-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .simulation-frame-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .simulation-frame-reset {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s;
        }

        .simulation-frame-reset:hover {
          background: var(--bg-primary);
        }

        .simulation-frame-iframe {
          width: 100%;
          height: 400px;
          border: none;
          background: #fff;
        }
      `}</style>
    </>
  );
};

export default SimulationFrame;
