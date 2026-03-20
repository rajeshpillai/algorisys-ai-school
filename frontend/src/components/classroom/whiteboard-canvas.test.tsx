import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import WhiteboardCanvas from './whiteboard-canvas';

// Mock marked
vi.mock('marked', () => ({
  marked: { parse: (content: string) => `<p>${content}</p>` },
}));

describe('WhiteboardCanvas', () => {
  it('renders SVG content', () => {
    const svg = '<svg viewBox="0 0 600 400"><rect width="100" height="100" fill="blue"/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    const svgEl = container.querySelector('svg');
    expect(svgEl).toBeTruthy();
    expect(svgEl?.getAttribute('viewBox')).toBe('0 0 600 400');
  });

  it('has whiteboard container class', () => {
    const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    expect(container.querySelector('.whiteboard-canvas')).toBeTruthy();
  });

  it('strips script tags from SVG for safety', () => {
    const svg = '<svg><script>alert("xss")</script><rect width="10" height="10"/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('rect')).toBeTruthy();
  });

  it('strips event handler attributes from SVG', () => {
    const svg = '<svg><rect width="10" height="10" onload="alert(1)" onclick="alert(2)"/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('onload')).toBeNull();
    expect(rect?.getAttribute('onclick')).toBeNull();
  });

  it('handles malformed SVG without crashing', () => {
    const svg = '<svg><not-closed';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    expect(container.querySelector('.whiteboard-canvas')).toBeTruthy();
  });

  it('shows label', () => {
    const svg = '<svg><rect/></svg>';
    render(() => <WhiteboardCanvas svg={svg} />);
    expect(screen.getByText('Whiteboard')).toBeTruthy();
  });
});
