import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import SlideViewer from './slide-viewer';

// Mock marked
vi.mock('marked', () => ({
  marked: { parse: (content: string) => `<p>${content}</p>` },
}));

const validSlides = JSON.stringify([
  { title: 'What is a Variable?', body: 'A named container for data.' },
  { title: 'Declaring Variables', body: 'Use `x = 5` in Python.' },
  { title: 'Variable Scope', body: 'Local vs global scope.' },
]);

describe('SlideViewer', () => {
  it('renders the first slide title on mount', () => {
    render(() => <SlideViewer content={validSlides} />);
    expect(screen.getByText('What is a Variable?')).toBeTruthy();
  });

  it('renders slide body content', () => {
    const { container } = render(() => <SlideViewer content={validSlides} />);
    expect(container.textContent).toContain('A named container for data.');
  });

  it('shows slide counter', () => {
    render(() => <SlideViewer content={validSlides} />);
    expect(screen.getByText('Slide 1 of 3')).toBeTruthy();
  });

  it('shows Presentation label', () => {
    render(() => <SlideViewer content={validSlides} />);
    expect(screen.getByText('Presentation')).toBeTruthy();
  });

  it('navigates to next slide on Next click', async () => {
    vi.useFakeTimers();
    render(() => <SlideViewer content={validSlides} />);
    await fireEvent.click(screen.getByText('Next'));
    vi.advanceTimersByTime(200);
    expect(screen.getByText('Declaring Variables')).toBeTruthy();
    expect(screen.getByText('Slide 2 of 3')).toBeTruthy();
    vi.useRealTimers();
  });

  it('navigates back on Prev click', async () => {
    vi.useFakeTimers();
    render(() => <SlideViewer content={validSlides} />);
    await fireEvent.click(screen.getByText('Next'));
    vi.advanceTimersByTime(200);
    await fireEvent.click(screen.getByText('Prev'));
    vi.advanceTimersByTime(200);
    expect(screen.getByText('What is a Variable?')).toBeTruthy();
    vi.useRealTimers();
  });

  it('disables Prev on first slide', () => {
    render(() => <SlideViewer content={validSlides} />);
    const prevBtn = screen.getByText('Prev') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('disables Next on last slide', async () => {
    vi.useFakeTimers();
    render(() => <SlideViewer content={validSlides} />);
    await fireEvent.click(screen.getByText('Next'));
    vi.advanceTimersByTime(200);
    await fireEvent.click(screen.getByText('Next'));
    vi.advanceTimersByTime(200);
    const nextBtn = screen.getByText('Next') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
    vi.useRealTimers();
  });

  it('renders dot indicators matching slide count', () => {
    const { container } = render(() => <SlideViewer content={validSlides} />);
    const dots = container.querySelectorAll('.slide-viewer-dot');
    expect(dots.length).toBe(3);
  });

  it('handles invalid JSON gracefully', () => {
    const { container } = render(() => <SlideViewer content="not json" />);
    // Should render fallback, not crash
    expect(container.querySelector('.slide-viewer')).toBeTruthy();
    expect(container.textContent).toContain('not json');
  });

  it('handles single slide (no navigation needed)', () => {
    const single = JSON.stringify([{ title: 'Only', body: 'One slide' }]);
    render(() => <SlideViewer content={single} />);
    expect(screen.getByText('Only')).toBeTruthy();
    expect((screen.getByText('Prev') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(true);
  });

  describe('crossfade transitions', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('applies fading class during slide transition', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      await fireEvent.click(screen.getByText('Next'));
      const content = container.querySelector('.slide-viewer-content');
      expect(content?.classList.contains('slide-viewer-content--fading')).toBe(true);
    });

    it('removes fading class after transition completes', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      await fireEvent.click(screen.getByText('Next'));
      vi.advanceTimersByTime(200);
      const content = container.querySelector('.slide-viewer-content');
      expect(content?.classList.contains('slide-viewer-content--fading')).toBe(false);
    });
  });

  describe('fullscreen mode', () => {
    it('has a fullscreen toggle button', () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      expect(container.querySelector('.slide-viewer-fullscreen-btn')).toBeTruthy();
    });

    it('adds fullscreen class when toggled', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      const btn = container.querySelector('.slide-viewer-fullscreen-btn') as HTMLButtonElement;
      await fireEvent.click(btn);
      expect(container.querySelector('.slide-viewer--fullscreen')).toBeTruthy();
    });

    it('removes fullscreen class on second toggle', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      const btn = container.querySelector('.slide-viewer-fullscreen-btn') as HTMLButtonElement;
      await fireEvent.click(btn);
      await fireEvent.click(btn);
      expect(container.querySelector('.slide-viewer--fullscreen')).toBeNull();
    });
  });

  describe('thumbnails sidebar', () => {
    it('shows thumbnails toggle in fullscreen', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      const fsBtn = container.querySelector('.slide-viewer-fullscreen-btn') as HTMLButtonElement;
      await fireEvent.click(fsBtn);
      expect(container.querySelector('.slide-viewer-thumbnails-btn')).toBeTruthy();
    });

    it('does not show thumbnails toggle in inline mode', () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      expect(container.querySelector('.slide-viewer-thumbnails-btn')).toBeNull();
    });

    it('shows thumbnail list when toggled in fullscreen', async () => {
      const { container } = render(() => <SlideViewer content={validSlides} />);
      const fsBtn = container.querySelector('.slide-viewer-fullscreen-btn') as HTMLButtonElement;
      await fireEvent.click(fsBtn);
      const thumbBtn = container.querySelector('.slide-viewer-thumbnails-btn') as HTMLButtonElement;
      await fireEvent.click(thumbBtn);
      const thumbnails = container.querySelectorAll('.slide-viewer-thumbnail');
      expect(thumbnails.length).toBe(3);
    });

    it('navigates to slide when thumbnail is clicked', async () => {
      vi.useFakeTimers();
      const { container } = render(() => <SlideViewer content={validSlides} />);
      const fsBtn = container.querySelector('.slide-viewer-fullscreen-btn') as HTMLButtonElement;
      await fireEvent.click(fsBtn);
      const thumbBtn = container.querySelector('.slide-viewer-thumbnails-btn') as HTMLButtonElement;
      await fireEvent.click(thumbBtn);
      const thumbnails = container.querySelectorAll('.slide-viewer-thumbnail');
      await fireEvent.click(thumbnails[2]);
      vi.advanceTimersByTime(200);
      // Slide title appears in the content area (h2)
      const title = container.querySelector('.slide-viewer-title');
      expect(title?.textContent).toBe('Variable Scope');
      expect(screen.getByText('Slide 3 of 3')).toBeTruthy();
      vi.useRealTimers();
    });
  });
});
