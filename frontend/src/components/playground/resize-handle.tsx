import type { Component } from 'solid-js';

interface ResizeHandleProps {
  orientation?: 'horizontal' | 'vertical';
}

const ResizeHandle: Component<ResizeHandleProps> = (props) => {
  const isVertical = () => (props.orientation || 'vertical') === 'vertical';

  return (
    <>
      <div
        class="resize-handle"
        classList={{
          'resize-handle-vertical': isVertical(),
          'resize-handle-horizontal': !isVertical(),
        }}
      >
        <div class="resize-handle-bar" />
      </div>

      <style>{`
        .resize-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .resize-handle-vertical {
          width: 8px;
          cursor: col-resize;
        }

        .resize-handle-horizontal {
          height: 8px;
          cursor: row-resize;
        }

        .resize-handle-bar {
          background: var(--border-color);
          border-radius: 2px;
          transition: background-color 0.15s;
        }

        .resize-handle-vertical .resize-handle-bar {
          width: 3px;
          height: 32px;
        }

        .resize-handle-horizontal .resize-handle-bar {
          height: 3px;
          width: 32px;
        }

        .resize-handle:hover .resize-handle-bar {
          background: var(--accent-color);
        }
      `}</style>
    </>
  );
};

export default ResizeHandle;
