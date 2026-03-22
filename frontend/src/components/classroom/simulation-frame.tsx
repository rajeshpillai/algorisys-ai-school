import { type Component, createSignal, onMount, onCleanup, Show } from 'solid-js';

interface SimulationFrameProps {
  html: string;
}

interface SimulationMessage {
  type: 'score' | 'complete' | 'progress';
  value: number;
  label?: string;
}

function isSimulationMessage(data: unknown): data is SimulationMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    (msg.type === 'score' || msg.type === 'complete' || msg.type === 'progress') &&
    typeof msg.value === 'number'
  );
}

const SimulationFrame: Component<SimulationFrameProps> = (props) => {
  let iframeRef: HTMLIFrameElement | undefined;
  const [badge, setBadge] = createSignal<SimulationMessage | null>(null);

  const handleReset = () => {
    if (iframeRef) {
      iframeRef.srcdoc = props.html;
    }
    setBadge(null);
  };

  const handleMessage = (event: MessageEvent) => {
    // Validate message shape (origin is 'null' for sandboxed iframes)
    if (!isSimulationMessage(event.data)) return;
    setBadge(event.data);
  };

  onMount(() => {
    window.addEventListener('message', handleMessage);
  });

  onCleanup(() => {
    window.removeEventListener('message', handleMessage);
  });

  const badgeText = () => {
    const b = badge();
    if (!b) return '';
    if (b.type === 'complete') return b.label || 'Complete';
    if (b.type === 'score') return `${b.label || 'Score'}: ${b.value}%`;
    if (b.type === 'progress') return b.label || `Progress: ${b.value}`;
    return '';
  };

  return (
    <>
      <div class="simulation-frame">
        <div class="simulation-frame-header">
          <span class="simulation-frame-label">Interactive Simulation</span>
          <div class="simulation-frame-header-right">
            <Show when={badge()}>
              <span
                class="simulation-frame-badge"
                classList={{
                  'simulation-frame-badge--complete': badge()?.type === 'complete',
                  'simulation-frame-badge--score': badge()?.type === 'score',
                  'simulation-frame-badge--progress': badge()?.type === 'progress',
                }}
              >
                {badgeText()}
              </span>
            </Show>
            <button class="simulation-frame-reset" onClick={handleReset}>Reset</button>
          </div>
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

        .simulation-frame-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .simulation-frame-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .simulation-frame-badge--complete {
          background: #d1fae5;
          color: #065f46;
        }

        .simulation-frame-badge--score {
          background: #dbeafe;
          color: #1e40af;
        }

        .simulation-frame-badge--progress {
          background: #fef3c7;
          color: #92400e;
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
