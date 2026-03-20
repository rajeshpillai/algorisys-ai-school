import { describe, it, expect, vi } from 'vitest';
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
    render(() => <SlideViewer content={validSlides} />);
    const nextBtn = screen.getByText('Next');
    await fireEvent.click(nextBtn);
    expect(screen.getByText('Declaring Variables')).toBeTruthy();
    expect(screen.getByText('Slide 2 of 3')).toBeTruthy();
  });

  it('navigates back on Prev click', async () => {
    render(() => <SlideViewer content={validSlides} />);
    await fireEvent.click(screen.getByText('Next'));
    await fireEvent.click(screen.getByText('Prev'));
    expect(screen.getByText('What is a Variable?')).toBeTruthy();
  });

  it('disables Prev on first slide', () => {
    render(() => <SlideViewer content={validSlides} />);
    const prevBtn = screen.getByText('Prev') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('disables Next on last slide', async () => {
    render(() => <SlideViewer content={validSlides} />);
    await fireEvent.click(screen.getByText('Next'));
    await fireEvent.click(screen.getByText('Next'));
    const nextBtn = screen.getByText('Next') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
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
});
