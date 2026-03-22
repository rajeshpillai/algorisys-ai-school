import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
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

  it('renders a canvas overlay element', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('canvas overlay is not interactive by default', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).not.toContain('active');
  });

  it('shows Annotate button', () => {
    const svg = '<svg><rect/></svg>';
    render(() => <WhiteboardCanvas svg={svg} />);
    expect(screen.getByTitle('Annotate')).toBeTruthy();
  });

  it('toggles draw mode and shows toolbar when Annotate clicked', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);

    // Toolbar should not be visible initially
    expect(container.querySelector('.drawing-toolbar')).toBeNull();

    // Click annotate
    fireEvent.click(screen.getByTitle('Annotate'));

    // Toolbar should appear
    expect(container.querySelector('.drawing-toolbar')).toBeTruthy();

    // Canvas should be active
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('active');

    // Button should now say "Done"
    expect(screen.getByTitle('Exit annotation')).toBeTruthy();
  });

  it('hides toolbar when Done clicked', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);

    // Enter draw mode
    fireEvent.click(screen.getByTitle('Annotate'));
    expect(container.querySelector('.drawing-toolbar')).toBeTruthy();

    // Exit draw mode
    fireEvent.click(screen.getByTitle('Exit annotation'));
    expect(container.querySelector('.drawing-toolbar')).toBeNull();
  });

  it('shows zoom indicator at 100% by default', () => {
    const svg = '<svg><rect/></svg>';
    render(() => <WhiteboardCanvas svg={svg} />);
    expect(screen.getByTitle('Zoom level').textContent).toBe('100%');
  });

  it('has a pannable viewport in view mode', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    expect(container.querySelector('.whiteboard-canvas-viewport--pannable')).toBeTruthy();
  });

  it('viewport is not pannable in draw mode', () => {
    const svg = '<svg><rect/></svg>';
    const { container } = render(() => <WhiteboardCanvas svg={svg} />);
    fireEvent.click(screen.getByTitle('Annotate'));
    expect(container.querySelector('.whiteboard-canvas-viewport--pannable')).toBeNull();
  });
});
