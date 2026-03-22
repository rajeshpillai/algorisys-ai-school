import { describe, it, expect } from 'vitest';
import { parseRichContent, mergeConsecutiveWhiteboards, RichSegment } from './rich-content-parser';

describe('parseRichContent', () => {
  it('returns a single markdown segment for plain text', () => {
    const result = parseRichContent('Hello world');
    expect(result).toEqual([{ type: 'markdown', content: 'Hello world' }]);
  });

  it('returns empty array for empty string', () => {
    const result = parseRichContent('');
    expect(result).toEqual([]);
  });

  it('extracts a whiteboard SVG block', () => {
    const svg = '<svg viewBox="0 0 600 400"><rect width="100" height="100"/></svg>';
    const input = `Here is a diagram:\n\n~~~whiteboard\n${svg}\n~~~\n\nWhat do you think?`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Here is a diagram:\n\n' });
    expect(result[1]).toEqual({ type: 'whiteboard', content: svg });
    expect(result[2]).toEqual({ type: 'markdown', content: '\n\nWhat do you think?' });
  });

  it('extracts a simulation HTML block', () => {
    const html = '<html><body><button>Click me</button><script>alert(1)</script></body></html>';
    const input = `Try this:\n\n~~~simulation\n${html}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Try this:\n\n' });
    expect(result[1]).toEqual({ type: 'simulation', content: html });
  });

  it('extracts multiple blocks of different types', () => {
    const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const html = '<html><body><p>Interactive</p></body></html>';
    const input = `First:\n\n~~~whiteboard\n${svg}\n~~~\n\nNow try:\n\n~~~simulation\n${html}\n~~~\n\nDone!`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('markdown');
    expect(result[1]).toEqual({ type: 'whiteboard', content: svg });
    expect(result[2].type).toBe('markdown');
    expect(result[3]).toEqual({ type: 'simulation', content: html });
    expect(result[4]).toEqual({ type: 'markdown', content: '\n\nDone!' });
  });

  it('handles multiple whiteboard blocks', () => {
    const svg1 = '<svg><text>Step 1</text></svg>';
    const svg2 = '<svg><text>Step 2</text></svg>';
    const input = `~~~whiteboard\n${svg1}\n~~~\n\nNext:\n\n~~~whiteboard\n${svg2}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'whiteboard', content: svg1 });
    expect(result[1].type).toBe('markdown');
    expect(result[2]).toEqual({ type: 'whiteboard', content: svg2 });
  });

  it('shows loading placeholder for incomplete whiteboard block during streaming', () => {
    const input = 'Here is a diagram:\n\n~~~whiteboard\n<svg><rect';
    const result = parseRichContent(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Here is a diagram:\n\n' });
    expect(result[1]).toEqual({ type: 'loading', blockType: 'whiteboard' });
  });

  it('shows loading placeholder for incomplete simulation block during streaming', () => {
    const input = 'Try this:\n\n~~~simulation\n<html><body>';
    const result = parseRichContent(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Try this:\n\n' });
    expect(result[1]).toEqual({ type: 'loading', blockType: 'simulation' });
  });

  it('does not confuse regular code fences with rich blocks', () => {
    const input = '```python\nprint("hello")\n```';
    const result = parseRichContent(input);

    expect(result).toEqual([{ type: 'markdown', content: input }]);
  });

  it('handles whiteboard block with no surrounding text', () => {
    const svg = '<svg><line x1="0" y1="0" x2="100" y2="100"/></svg>';
    const input = `~~~whiteboard\n${svg}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'whiteboard', content: svg });
  });

  it('trims whitespace from extracted block content', () => {
    const input = '~~~whiteboard\n  <svg><rect/></svg>  \n~~~';
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'whiteboard', content: '<svg><rect/></svg>' });
  });

  it('handles block with backtick fence (``` instead of ~~~)', () => {
    const svg = '<svg><rect/></svg>';
    const input = '```whiteboard\n' + svg + '\n```';
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'whiteboard', content: svg });
  });

  it('extracts a slides block', () => {
    const slides = '[{"title":"Intro","body":"Hello world"}]';
    const input = `Let me explain:\n\n~~~slides\n${slides}\n~~~\n\nAny questions?`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Let me explain:\n\n' });
    expect(result[1]).toEqual({ type: 'slides', content: slides });
    expect(result[2]).toEqual({ type: 'markdown', content: '\n\nAny questions?' });
  });

  it('shows loading placeholder for incomplete slides block during streaming', () => {
    const input = 'Here we go:\n\n~~~slides\n[{"title":"Intro"';
    const result = parseRichContent(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Here we go:\n\n' });
    expect(result[1]).toEqual({ type: 'loading', blockType: 'slides' });
  });

  it('handles slides block with no surrounding text', () => {
    const slides = '[{"title":"A","body":"B"}]';
    const input = `~~~slides\n${slides}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'slides', content: slides });
  });

  // --- Params support ---

  it('extracts params from block type (e.g. simulation:template=bubble-sort)', () => {
    const input = '~~~simulation:template=bubble-sort\n\n~~~';
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('simulation');
    expect((result[0] as any).params).toBe('template=bubble-sort');
    expect(result[0].content).toBe('');
  });

  it('params are undefined when not provided', () => {
    const html = '<html><body>Hello</body></html>';
    const input = `~~~simulation\n${html}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect((result[0] as any).params).toBeUndefined();
  });

  it('handles simulation:template with content body', () => {
    const input = '~~~simulation:template=stack-queue\nsome override content\n~~~';
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('simulation');
    expect((result[0] as any).params).toBe('template=stack-queue');
    expect(result[0].content).toBe('some override content');
  });

  it('shows loading placeholder for incomplete block with params', () => {
    const input = 'Try this:\n\n~~~simulation:template=bubble-sort\n<partial...';
    const result = parseRichContent(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'markdown', content: 'Try this:\n\n' });
    expect(result[1]).toEqual({ type: 'loading', blockType: 'simulation' });
  });

  it('params work with backtick fence', () => {
    const input = '```simulation:template=projectile-motion\n\n```';
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('simulation');
    expect((result[0] as any).params).toBe('template=projectile-motion');
  });

  it('whiteboard blocks without params still work', () => {
    const svg = '<svg><rect/></svg>';
    const input = `~~~whiteboard\n${svg}\n~~~`;
    const result = parseRichContent(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'whiteboard', content: svg });
    expect((result[0] as any).params).toBeUndefined();
  });
});

describe('mergeConsecutiveWhiteboards', () => {
  const DELIMITER = '\n---SLIDE---\n';

  it('merges two adjacent whiteboard segments', () => {
    const segments: RichSegment[] = [
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'whiteboard', content: '<svg>2</svg>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('whiteboard');
    expect(result[0].content).toBe(`<svg>1</svg>${DELIMITER}<svg>2</svg>`);
  });

  it('merges whiteboards separated by short markdown', () => {
    const segments: RichSegment[] = [
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'markdown', content: '\n\nNext:\n\n' },
      { type: 'whiteboard', content: '<svg>2</svg>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(1);
    expect(result[0].content).toContain('<svg>1</svg>');
    expect(result[0].content).toContain('<svg>2</svg>');
  });

  it('does NOT merge whiteboards separated by long markdown', () => {
    const longText = 'A'.repeat(60);
    const segments: RichSegment[] = [
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'markdown', content: longText },
      { type: 'whiteboard', content: '<svg>2</svg>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(3);
  });

  it('does NOT merge whiteboard with non-whiteboard block between', () => {
    const segments: RichSegment[] = [
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'simulation', content: '<html></html>' },
      { type: 'whiteboard', content: '<svg>2</svg>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(3);
  });

  it('returns single whiteboard unchanged', () => {
    const segments: RichSegment[] = [
      { type: 'markdown', content: 'Hello' },
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'markdown', content: 'Bye' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(3);
    expect(result[1].content).toBe('<svg>1</svg>');
    // Should NOT contain delimiter
    expect(result[1].content).not.toContain(DELIMITER);
  });

  it('merges three consecutive whiteboards', () => {
    const segments: RichSegment[] = [
      { type: 'whiteboard', content: '<svg>1</svg>' },
      { type: 'whiteboard', content: '<svg>2</svg>' },
      { type: 'whiteboard', content: '<svg>3</svg>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe(`<svg>1</svg>${DELIMITER}<svg>2</svg>${DELIMITER}<svg>3</svg>`);
  });

  it('preserves non-whiteboard segments', () => {
    const segments: RichSegment[] = [
      { type: 'markdown', content: 'Intro' },
      { type: 'simulation', content: '<html></html>' },
    ];
    const result = mergeConsecutiveWhiteboards(segments);
    expect(result).toEqual(segments);
  });
});
