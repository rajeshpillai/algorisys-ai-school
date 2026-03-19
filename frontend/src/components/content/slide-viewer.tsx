import type { Component } from 'solid-js';

interface SlideViewerProps {
  content: string;
}

const SlideViewer: Component<SlideViewerProps> = (props) => {
  return (
    <>
      <div class="slide-viewer">
        <div class="slide-viewer-content">{props.content}</div>
      </div>

      <style>{`
        .slide-viewer {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2rem;
          min-height: 300px;
        }

        .slide-viewer-content {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--text-primary);
        }
      `}</style>
    </>
  );
};

export default SlideViewer;
