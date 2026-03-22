import { createSignal, Show, For } from 'solid-js';
import WhiteboardCanvas from './whiteboard-canvas';

const SLIDE_DELIMITER = '\n---SLIDE---\n';

export default function WhiteboardCanvasAdapter(props: { content: string; params?: string }) {
  const slides = () => {
    if (props.content.includes(SLIDE_DELIMITER)) {
      return props.content.split(SLIDE_DELIMITER);
    }
    return [props.content];
  };

  const [currentSlide, setCurrentSlide] = createSignal(0);
  const isMultiSlide = () => slides().length > 1;

  const goTo = (index: number) => {
    const max = slides().length - 1;
    setCurrentSlide(Math.max(0, Math.min(index, max)));
  };

  return (
    <div>
      <WhiteboardCanvas svg={slides()[currentSlide()]} />
      <Show when={isMultiSlide()}>
        <div class="whiteboard-slide-nav">
          <button
            class="whiteboard-slide-nav-btn"
            disabled={currentSlide() === 0}
            onClick={() => goTo(currentSlide() - 1)}
          >
            ‹ Prev
          </button>
          <div class="whiteboard-slide-dots">
            <For each={slides()}>
              {(_, i) => (
                <button
                  class="whiteboard-slide-dot"
                  classList={{ 'whiteboard-slide-dot--active': currentSlide() === i() }}
                  onClick={() => goTo(i())}
                  title={`Slide ${i() + 1}`}
                />
              )}
            </For>
          </div>
          <span class="whiteboard-slide-counter">{currentSlide() + 1} / {slides().length}</span>
          <button
            class="whiteboard-slide-nav-btn"
            disabled={currentSlide() === slides().length - 1}
            onClick={() => goTo(currentSlide() + 1)}
          >
            Next ›
          </button>
        </div>

        <style>{`
          .whiteboard-slide-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.5rem;
            margin-top: -0.5rem;
          }

          .whiteboard-slide-nav-btn {
            font-size: 0.8rem;
            padding: 0.25rem 0.6rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            cursor: pointer;
            transition: background 0.15s;
          }

          .whiteboard-slide-nav-btn:hover:not(:disabled) {
            background: var(--bg-primary);
          }

          .whiteboard-slide-nav-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }

          .whiteboard-slide-dots {
            display: flex;
            gap: 4px;
          }

          .whiteboard-slide-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: none;
            background: var(--border-color);
            cursor: pointer;
            padding: 0;
            transition: background 0.15s;
          }

          .whiteboard-slide-dot--active {
            background: var(--accent-color);
          }

          .whiteboard-slide-counter {
            font-size: 0.75rem;
            color: var(--text-muted);
            min-width: 3rem;
            text-align: center;
          }
        `}</style>
      </Show>
    </div>
  );
}
