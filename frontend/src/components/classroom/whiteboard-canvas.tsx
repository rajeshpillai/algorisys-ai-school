import { type Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { DrawingEngine } from '../../lib/drawing-engine';
import type { DrawTool } from '../../lib/drawing-engine';
import DrawingToolbar from './drawing-toolbar';

interface WhiteboardCanvasProps {
  svg: string;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

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

  const [drawMode, setDrawMode] = createSignal(false);
  const [activeTool, setActiveTool] = createSignal<DrawTool>('freehand');
  const [activeColor, setActiveColor] = createSignal('#000000');
  const [activeStrokeWidth, setActiveStrokeWidth] = createSignal(2);
  const [canUndo, setCanUndo] = createSignal(false);
  const [canRedo, setCanRedo] = createSignal(false);

  // Zoom/pan state
  const [zoom, setZoom] = createSignal(1);
  const [panX, setPanX] = createSignal(0);
  const [panY, setPanY] = createSignal(0);
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;

  const engine = new DrawingEngine();
  let canvasRef: HTMLCanvasElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let isDrawing = false;

  const syncState = () => {
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());
  };

  const redraw = () => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (ctx) engine.render(ctx);
  };

  const getCanvasCoords = (e: PointerEvent): { x: number; y: number } => {
    if (!canvasRef) return { x: 0, y: 0 };
    const rect = canvasRef.getBoundingClientRect();
    const scaleX = canvasRef.width / rect.width;
    const scaleY = canvasRef.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!drawMode()) return;
    isDrawing = true;
    const { x, y } = getCanvasCoords(e);

    if (activeTool() === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        engine.beginStroke(x, y, 'text', activeColor(), activeStrokeWidth());
        engine.endStroke(text);
        syncState();
        redraw();
      }
      return;
    }

    engine.beginStroke(x, y, activeTool(), activeColor(), activeStrokeWidth());
    canvasRef?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDrawing || !drawMode()) return;
    const { x, y } = getCanvasCoords(e);
    engine.continueStroke(x, y);
    redraw();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    isDrawing = false;
    engine.endStroke();
    syncState();
    redraw();
  };

  // Pan handlers (on the outer content container, not canvas)
  const handlePanDown = (e: PointerEvent) => {
    if (drawMode()) return; // pan only in view mode
    isPanning = true;
    panStartX = e.clientX - panX();
    panStartY = e.clientY - panY();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanMove = (e: PointerEvent) => {
    if (!isPanning) return;
    setPanX(e.clientX - panStartX);
    setPanY(e.clientY - panStartY);
  };

  const handlePanUp = () => {
    isPanning = false;
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const transformStyle = () =>
    `transform: translate(${panX()}px, ${panY()}px) scale(${zoom()}); transform-origin: 0 0;`;

  const syncCanvasSize = () => {
    if (!canvasRef || !containerRef) return;
    const svgDiv = containerRef.querySelector('.whiteboard-canvas-svg');
    if (!svgDiv) return;
    const { width, height } = svgDiv.getBoundingClientRect();
    if (width > 0 && height > 0) {
      canvasRef.width = width;
      canvasRef.height = height;
      redraw();
    }
  };

  let resizeObserver: ResizeObserver | undefined;

  onMount(() => {
    if (containerRef && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncCanvasSize());
      resizeObserver.observe(containerRef);
    }
    syncCanvasSize();
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
  });

  return (
    <>
      <div class="whiteboard-canvas" ref={containerRef}>
        <div class="whiteboard-canvas-header">
          <span class="whiteboard-canvas-label">Whiteboard</span>
          <div class="whiteboard-canvas-header-right">
            <Show when={zoom() !== 1 || panX() !== 0 || panY() !== 0}>
              <button class="whiteboard-canvas-zoom-btn" onClick={resetView} title="Fit to view">
                Fit
              </button>
            </Show>
            <span class="whiteboard-canvas-zoom-indicator" title="Zoom level">
              {Math.round(zoom() * 100)}%
            </span>
            <button
              class="whiteboard-canvas-annotate-btn"
              classList={{ 'whiteboard-canvas-annotate-btn--active': drawMode() }}
              onClick={() => setDrawMode(!drawMode())}
              title={drawMode() ? 'Exit annotation' : 'Annotate'}
            >
              {drawMode() ? 'Done' : 'Annotate'}
            </button>
          </div>
        </div>
        <Show when={drawMode()}>
          <DrawingToolbar
            activeTool={activeTool()}
            activeColor={activeColor()}
            activeStrokeWidth={activeStrokeWidth()}
            canUndo={canUndo()}
            canRedo={canRedo()}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            onStrokeWidthChange={setActiveStrokeWidth}
            onUndo={() => { engine.undo(); syncState(); redraw(); }}
            onRedo={() => { engine.redo(); syncState(); redraw(); }}
            onClear={() => { engine.clear(); syncState(); redraw(); }}
          />
        </Show>
        <div
          class="whiteboard-canvas-viewport"
          classList={{ 'whiteboard-canvas-viewport--pannable': !drawMode() }}
          onWheel={handleWheel}
          onPointerDown={handlePanDown}
          onPointerMove={handlePanMove}
          onPointerUp={handlePanUp}
          onPointerLeave={handlePanUp}
        >
          <div class="whiteboard-canvas-content" style={transformStyle()}>
            <div class="whiteboard-canvas-svg" innerHTML={sanitized()} />
            <canvas
              ref={canvasRef}
              class="whiteboard-canvas-overlay"
              classList={{ 'whiteboard-canvas-overlay--active': drawMode() }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </div>
      </div>

      <style>{`
        .whiteboard-canvas {
          margin: 0.75rem 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .whiteboard-canvas-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .whiteboard-canvas-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .whiteboard-canvas-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .whiteboard-canvas-zoom-indicator {
          font-size: 0.65rem;
          color: var(--text-muted);
          min-width: 2.5rem;
          text-align: center;
        }

        .whiteboard-canvas-zoom-btn {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.15rem 0.4rem;
          border: 1px solid var(--border-color);
          border-radius: 3px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s;
        }

        .whiteboard-canvas-zoom-btn:hover {
          background: var(--bg-primary);
        }

        .whiteboard-canvas-annotate-btn {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .whiteboard-canvas-annotate-btn:hover {
          background: var(--bg-primary);
        }

        .whiteboard-canvas-annotate-btn--active {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .whiteboard-canvas-annotate-btn--active:hover {
          background: var(--accent-color);
        }

        .whiteboard-canvas-viewport {
          overflow: hidden;
        }

        .whiteboard-canvas-viewport--pannable {
          cursor: grab;
        }

        .whiteboard-canvas-viewport--pannable:active {
          cursor: grabbing;
        }

        .whiteboard-canvas-content {
          position: relative;
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

        .whiteboard-canvas-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .whiteboard-canvas-overlay--active {
          pointer-events: auto;
          cursor: crosshair;
        }
      `}</style>
    </>
  );
};

export default WhiteboardCanvas;
