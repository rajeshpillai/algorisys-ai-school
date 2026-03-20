import { type Component } from 'solid-js';

interface WhiteboardCanvasProps {
  svg: string;
}

/**
 * Sanitize SVG string: remove script tags, event handlers, and javascript: URLs.
 */
function sanitizeSvg(svg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;

  // Remove all script elements
  root.querySelectorAll('script').forEach((el) => el.remove());

  // Remove event handler attributes and javascript: URLs from all elements
  const allElements = root.querySelectorAll('*');
  allElements.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return root.outerHTML;
}

const WhiteboardCanvas: Component<WhiteboardCanvasProps> = (props) => {
  const sanitized = () => sanitizeSvg(props.svg);

  return (
    <>
      <div class="whiteboard-canvas">
        <div class="whiteboard-canvas-label">Whiteboard</div>
        <div class="whiteboard-canvas-svg" innerHTML={sanitized()} />
      </div>

      <style>{`
        .whiteboard-canvas {
          margin: 0.75rem 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .whiteboard-canvas-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .whiteboard-canvas-svg {
          padding: 1rem;
          display: flex;
          justify-content: center;
          overflow-x: auto;
        }

        .whiteboard-canvas-svg svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </>
  );
};

export default WhiteboardCanvas;
