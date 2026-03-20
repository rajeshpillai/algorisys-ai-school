import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import SimulationFrame from './simulation-frame';

// Mock marked
vi.mock('marked', () => ({
  marked: { parse: (content: string) => `<p>${content}</p>` },
}));

describe('SimulationFrame', () => {
  it('renders an iframe', () => {
    const html = '<html><body><p>Hello</p></body></html>';
    const { container } = render(() => <SimulationFrame html={html} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });

  it('sets srcdoc on the iframe', () => {
    const html = '<html><body><p>Interactive</p></body></html>';
    const { container } = render(() => <SimulationFrame html={html} />);
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('srcdoc')).toContain('Interactive');
  });

  it('sets sandbox attribute with allow-scripts', () => {
    const html = '<html><body></body></html>';
    const { container } = render(() => <SimulationFrame html={html} />);
    const iframe = container.querySelector('iframe');
    const sandbox = iframe?.getAttribute('sandbox');
    expect(sandbox).toContain('allow-scripts');
  });

  it('does NOT allow same-origin in sandbox', () => {
    const html = '<html><body></body></html>';
    const { container } = render(() => <SimulationFrame html={html} />);
    const iframe = container.querySelector('iframe');
    const sandbox = iframe?.getAttribute('sandbox');
    expect(sandbox).not.toContain('allow-same-origin');
  });

  it('has simulation container class', () => {
    const html = '<html><body></body></html>';
    const { container } = render(() => <SimulationFrame html={html} />);
    expect(container.querySelector('.simulation-frame')).toBeTruthy();
  });

  it('shows label', () => {
    const html = '<html><body></body></html>';
    render(() => <SimulationFrame html={html} />);
    expect(screen.getByText('Interactive Simulation')).toBeTruthy();
  });

  it('has a reset button', () => {
    const html = '<html><body></body></html>';
    render(() => <SimulationFrame html={html} />);
    expect(screen.getByText('Reset')).toBeTruthy();
  });
});
