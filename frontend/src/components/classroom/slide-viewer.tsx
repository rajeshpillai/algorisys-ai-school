import { createSignal, Show, type Component } from 'solid-js';
import { renderMarkdown } from '../../lib/markdown-renderer';
import { parseSlides } from '../../lib/slide-parser';

interface SlideViewerProps {
  content: string;
}

const SlideViewer: Component<SlideViewerProps> = (props) => {
  const slides = () => parseSlides(props.content);
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const current = () => slides()?.[currentIndex()];
  const total = () => slides()?.length ?? 0;
  const isFirst = () => currentIndex() === 0;
  const isLast = () => currentIndex() >= total() - 1;

  const prev = () => { if (!isFirst()) setCurrentIndex((i) => i - 1); };
  const next = () => { if (!isLast()) setCurrentIndex((i) => i + 1); };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };

  return (
    <>
      <div class="slide-viewer" tabIndex={0} onKeyDown={handleKeyDown}>
        <Show
          when={slides() && slides()!.length > 0}
          fallback={
            <div class="slide-viewer-fallback">
              <div class="slide-viewer-header">
                <span class="slide-viewer-label">Presentation</span>
              </div>
              <div class="slide-viewer-content" innerHTML={renderMarkdown(props.content)} />
            </div>
          }
        >
          <div class="slide-viewer-header">
            <span class="slide-viewer-label">Presentation</span>
            <span class="slide-viewer-counter">Slide {currentIndex() + 1} of {total()}</span>
          </div>
          <div class="slide-viewer-content">
            <h2 class="slide-viewer-title">{current()?.title}</h2>
            <div class="slide-viewer-body" innerHTML={renderMarkdown(current()?.body ?? '')} />
          </div>
          <div class="slide-viewer-nav">
            <button class="slide-viewer-nav-btn" onClick={prev} disabled={isFirst()}>Prev</button>
            <div class="slide-viewer-dots">
              {Array.from({ length: total() }).map((_, i) => (
                <span
                  class="slide-viewer-dot"
                  classList={{ 'slide-viewer-dot--active': i === currentIndex() }}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
            <button class="slide-viewer-nav-btn" onClick={next} disabled={isLast()}>Next</button>
          </div>
        </Show>
      </div>

      <style>{`
        .slide-viewer {
          margin: 0.75rem 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
          outline: none;
        }

        .slide-viewer:focus-within {
          border-color: var(--accent-color);
        }

        .slide-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .slide-viewer-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .slide-viewer-counter {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .slide-viewer-content {
          padding: 1.25rem 1.5rem;
          min-height: 120px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .slide-viewer-title {
          margin: 0 0 0.75rem;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .slide-viewer-body {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .slide-viewer-body p {
          margin: 0 0 0.5rem;
        }

        .slide-viewer-body p:last-child {
          margin-bottom: 0;
        }

        .slide-viewer-body pre {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.75rem;
          overflow-x: auto;
          font-size: 0.85rem;
          margin: 0.5rem 0;
        }

        .slide-viewer-body code {
          background: var(--bg-tertiary);
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-size: 0.85em;
        }

        .slide-viewer-body pre code {
          background: none;
          padding: 0;
        }

        .slide-viewer-body ul,
        .slide-viewer-body ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .slide-viewer-body .katex-display {
          margin: 0.75rem 0;
          overflow-x: auto;
        }

        .slide-viewer-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .slide-viewer-nav-btn {
          font-size: 0.75rem;
          padding: 0.3rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .slide-viewer-nav-btn:hover:not(:disabled) {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .slide-viewer-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .slide-viewer-dots {
          display: flex;
          gap: 0.35rem;
          align-items: center;
        }

        .slide-viewer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border-color);
          cursor: pointer;
          transition: background 0.15s;
        }

        .slide-viewer-dot--active {
          background: var(--accent-color);
        }
      `}</style>
    </>
  );
};

export default SlideViewer;
