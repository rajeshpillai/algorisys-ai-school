import { type Component, For } from 'solid-js';
import type { DrawTool } from '../../lib/drawing-engine';

interface DrawingToolbarProps {
  activeTool: DrawTool;
  activeColor: string;
  activeStrokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const TOOLS: { tool: DrawTool; label: string; icon: string }[] = [
  { tool: 'freehand', label: 'Pen', icon: '✏' },
  { tool: 'line', label: 'Line', icon: '╱' },
  { tool: 'rect', label: 'Rectangle', icon: '▭' },
  { tool: 'circle', label: 'Circle', icon: '○' },
  { tool: 'text', label: 'Text', icon: 'T' },
  { tool: 'eraser', label: 'Eraser', icon: '⌫' },
];

const COLORS = [
  '#000000', '#ef4444', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
];

const WIDTHS: { width: number; label: string }[] = [
  { width: 2, label: 'Thin' },
  { width: 4, label: 'Medium' },
  { width: 6, label: 'Thick' },
];

const DrawingToolbar: Component<DrawingToolbarProps> = (props) => {
  return (
    <>
      <div class="drawing-toolbar">
        <div class="drawing-toolbar-group">
          <For each={TOOLS}>
            {(t) => (
              <button
                class="drawing-toolbar-btn"
                classList={{ 'drawing-toolbar-btn--active': props.activeTool === t.tool }}
                title={t.label}
                onClick={() => props.onToolChange(t.tool)}
              >
                {t.icon}
              </button>
            )}
          </For>
        </div>

        <div class="drawing-toolbar-separator" />

        <div class="drawing-toolbar-group">
          <For each={COLORS}>
            {(color) => (
              <button
                class="drawing-toolbar-color"
                classList={{ 'drawing-toolbar-color--active': props.activeColor === color }}
                style={{ background: color }}
                title={color}
                onClick={() => props.onColorChange(color)}
              />
            )}
          </For>
        </div>

        <div class="drawing-toolbar-separator" />

        <div class="drawing-toolbar-group">
          <For each={WIDTHS}>
            {(w) => (
              <button
                class="drawing-toolbar-width"
                classList={{ 'drawing-toolbar-width--active': props.activeStrokeWidth === w.width }}
                title={w.label}
                onClick={() => props.onStrokeWidthChange(w.width)}
              >
                <span
                  class="drawing-toolbar-width-dot"
                  style={{ width: `${w.width * 2}px`, height: `${w.width * 2}px` }}
                />
              </button>
            )}
          </For>
        </div>

        <div class="drawing-toolbar-separator" />

        <div class="drawing-toolbar-group">
          <button
            class="drawing-toolbar-btn"
            title="Undo"
            disabled={!props.canUndo}
            onClick={() => props.onUndo()}
          >
            ↩
          </button>
          <button
            class="drawing-toolbar-btn"
            title="Redo"
            disabled={!props.canRedo}
            onClick={() => props.onRedo()}
          >
            ↪
          </button>
          <button
            class="drawing-toolbar-btn"
            title="Clear"
            onClick={() => props.onClear()}
          >
            🗑
          </button>
        </div>
      </div>

      <style>{`
        .drawing-toolbar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0.5rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .drawing-toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .drawing-toolbar-separator {
          width: 1px;
          height: 20px;
          background: var(--border-color);
          margin: 0 0.25rem;
        }

        .drawing-toolbar-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 4px;
          background: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.1s, border-color 0.1s;
        }

        .drawing-toolbar-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
          border-color: var(--border-color);
        }

        .drawing-toolbar-btn--active {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .drawing-toolbar-btn--active:hover {
          background: var(--accent-color);
          border-color: var(--accent-color);
        }

        .drawing-toolbar-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .drawing-toolbar-color {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-radius: 50%;
          cursor: pointer;
          transition: border-color 0.1s, transform 0.1s;
        }

        .drawing-toolbar-color:hover {
          transform: scale(1.15);
        }

        .drawing-toolbar-color--active {
          border-color: var(--text-primary);
          transform: scale(1.15);
        }

        .drawing-toolbar-width {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 4px;
          background: none;
          cursor: pointer;
          transition: background 0.1s;
        }

        .drawing-toolbar-width:hover {
          background: var(--bg-tertiary);
        }

        .drawing-toolbar-width--active {
          background: var(--bg-tertiary);
          border-color: var(--border-color);
        }

        .drawing-toolbar-width-dot {
          display: block;
          border-radius: 50%;
          background: var(--text-secondary);
        }
      `}</style>
    </>
  );
};

export default DrawingToolbar;
