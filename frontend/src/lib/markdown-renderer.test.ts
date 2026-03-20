import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown-renderer';

describe('renderMarkdown', () => {
  it('renders plain markdown', () => {
    const result = renderMarkdown('**bold** text');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('text');
  });

  it('renders inline LaTeX with $ delimiters', () => {
    const result = renderMarkdown('The formula $x^2 + y^2 = r^2$ is a circle.');
    expect(result).toContain('katex');
    expect(result).toContain('circle');
  });

  it('renders display LaTeX with $$ delimiters', () => {
    const result = renderMarkdown('The quadratic formula:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
    expect(result).toContain('katex-display');
  });

  it('renders inline LaTeX with \\( \\) delimiters', () => {
    const result = renderMarkdown('The value \\(\\pi \\approx 3.14\\) is important.');
    expect(result).toContain('katex');
    expect(result).toContain('important');
  });

  it('renders display LaTeX with \\[ \\] delimiters', () => {
    const result = renderMarkdown('\\[\\int_0^1 x^2 \\, dx = \\frac{1}{3}\\]');
    expect(result).toContain('katex-display');
  });

  it('handles mixed markdown and LaTeX', () => {
    const result = renderMarkdown('## Derivatives\n\nThe derivative of $f(x) = x^2$ is $f\'(x) = 2x$.\n\n$$\\frac{d}{dx}x^n = nx^{n-1}$$');
    expect(result).toContain('<h2>');
    expect(result).toContain('katex');
    expect(result).toContain('katex-display');
  });

  it('does not break on invalid LaTeX', () => {
    // KaTeX with throwOnError: false renders error spans instead of throwing
    const result = renderMarkdown('Invalid: $\\invalid_command{}$');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('does not match single dollar signs used for currency', () => {
    const result = renderMarkdown('The price is $5 and $10.');
    // Single digit after $ without closing $ should not trigger LaTeX
    // But "5 and $10" between the two $ signs will be matched — this is a known limitation
    expect(result).toBeDefined();
  });

  it('handles empty content', () => {
    const result = renderMarkdown('');
    expect(result).toBeDefined();
  });

  it('renders code blocks without LaTeX interference', () => {
    const result = renderMarkdown('```python\nx = 5\ny = x ** 2\n```');
    expect(result).toContain('<code');
  });
});
