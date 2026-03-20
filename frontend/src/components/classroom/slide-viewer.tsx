import { createSignal, Show, onCleanup, type Component } from 'solid-js';
import { renderMarkdown } from '../../lib/markdown-renderer';
import { parseSlides } from '../../lib/slide-parser';

interface SlideViewerProps {
  content: string;
}

const SlideViewer: Component<SlideViewerProps> = (props) => {
  const slides = () => parseSlides(props.content);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [transitioning, setTransitioning] = createSignal(false);
  const [fullscreen, setFullscreen] = createSignal(false);
  const [showThumbnails, setShowThumbnails] = createSignal(false);

  let viewerRef: HTMLDivElement | undefined;

  const current = () => slides()?.[currentIndex()];
  const total = () => slides()?.length ?? 0;
  const isFirst = () => currentIndex() === 0;
  const isLast = () => currentIndex() >= total() - 1;

  const goToSlide = (index: number) => {
    if (index === currentIndex() || index < 0 || index >= total()) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTransitioning(false);
    }, 150);
  };

  const prev = () => { if (!isFirst()) goToSlide(currentIndex() - 1); };
  const next = () => { if (!isLast()) goToSlide(currentIndex() + 1); };

  const toggleFullscreen = () => {
    if (fullscreen()) {
      setShowThumbnails(false);
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
      setTimeout(() => viewerRef?.focus(), 0);
    }
    setFullscreen(!fullscreen());
  };

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape' && fullscreen()) toggleFullscreen();
  };

  return (
    <>
      <div
        class="slide-viewer"
        classList={{ 'slide-viewer--fullscreen': fullscreen() }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        ref={viewerRef}
      >
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
            <div class="slide-viewer-header-left">
              <Show when={fullscreen()}>
                <button
                  class="slide-viewer-thumbnails-btn"
                  onClick={() => setShowThumbnails(!showThumbnails())}
                  title="Toggle slide list"
                >
                  &#9776;
                </button>
              </Show>
              <span class="slide-viewer-label">Presentation</span>
            </div>
            <div class="slide-viewer-header-right">
              <span class="slide-viewer-counter">Slide {currentIndex() + 1} of {total()}</span>
              <button
                class="slide-viewer-fullscreen-btn"
                onClick={toggleFullscreen}
                title={fullscreen() ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen() ? '\u2715' : '\u26F6'}
              </button>
            </div>
          </div>
          <div class="slide-viewer-stage">
            <Show when={fullscreen() && showThumbnails()}>
              <div class="slide-viewer-thumbnails">
                {slides()!.map((slide, i) => (
                  <div
                    class="slide-viewer-thumbnail"
                    classList={{ 'slide-viewer-thumbnail--active': i === currentIndex() }}
                    onClick={() => goToSlide(i)}
                  >
                    <span class="slide-viewer-thumbnail-num">{i + 1}</span>
                    <span class="slide-viewer-thumbnail-title">{slide.title}</span>
                  </div>
                ))}
              </div>
            </Show>
            <div
              class="slide-viewer-content"
              classList={{ 'slide-viewer-content--fading': transitioning() }}
            >
              <h2 class="slide-viewer-title">{current()?.title}</h2>
              <div class="slide-viewer-body" innerHTML={renderMarkdown(current()?.body ?? '')} />
            </div>
          </div>
          <div class="slide-viewer-nav">
            <button class="slide-viewer-nav-btn" onClick={prev} disabled={isFirst()}>Prev</button>
            <div class="slide-viewer-dots">
              {Array.from({ length: total() }).map((_, i) => (
                <span
                  class="slide-viewer-dot"
                  classList={{ 'slide-viewer-dot--active': i === currentIndex() }}
                  onClick={() => goToSlide(i)}
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

        .slide-viewer--fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1000;
          border-radius: 0;
          border: none;
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .slide-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .slide-viewer-header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .slide-viewer-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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

        .slide-viewer-fullscreen-btn,
        .slide-viewer-thumbnails-btn {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.15rem 0.4rem;
          font-size: 0.75rem;
          transition: color 0.15s, background 0.15s;
        }

        .slide-viewer-fullscreen-btn:hover,
        .slide-viewer-thumbnails-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .slide-viewer-stage {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .slide-viewer-thumbnails {
          width: 200px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-color);
          background: var(--bg-secondary);
          overflow-y: auto;
          padding: 0.5rem;
        }

        .slide-viewer-thumbnail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: background 0.15s;
        }

        .slide-viewer-thumbnail:hover {
          background: var(--bg-tertiary);
        }

        .slide-viewer-thumbnail--active {
          background: var(--bg-tertiary);
          color: var(--accent-color);
          font-weight: 600;
        }

        .slide-viewer-thumbnail-num {
          flex-shrink: 0;
          width: 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .slide-viewer-thumbnail-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .slide-viewer-content {
          padding: 1.25rem 1.5rem;
          min-height: 120px;
          max-height: 60vh;
          overflow-y: auto;
          transition: opacity 0.15s ease-in-out;
          opacity: 1;
          flex: 1;
        }

        .slide-viewer-content--fading {
          opacity: 0;
        }

        .slide-viewer--fullscreen .slide-viewer-content {
          max-height: none;
          padding: 2rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .slide-viewer--fullscreen .slide-viewer-title {
          font-size: 1.8rem;
        }

        .slide-viewer--fullscreen .slide-viewer-body {
          font-size: 1.15rem;
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
