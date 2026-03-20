import { describe, it, expect } from 'vitest';
import { parseSlides } from './slide-parser';

describe('parseSlides', () => {
  it('parses valid JSON array of slides', () => {
    const json = '[{"title":"Intro","body":"Hello world"},{"title":"Details","body":"More info"}]';
    const result = parseSlides(json);
    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({ title: 'Intro', body: 'Hello world' });
    expect(result![1]).toEqual({ title: 'Details', body: 'More info' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseSlides('not json')).toBeNull();
    expect(parseSlides('{broken')).toBeNull();
  });

  it('returns null for non-array JSON', () => {
    expect(parseSlides('{"title":"A","body":"B"}')).toBeNull();
  });

  it('returns empty array for empty JSON array', () => {
    expect(parseSlides('[]')).toEqual([]);
  });

  it('filters out entries missing title or body', () => {
    const json = '[{"title":"Good","body":"OK"},{"title":"No body"},{"body":"No title"},{"other":1}]';
    const result = parseSlides(json);
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({ title: 'Good', body: 'OK' });
  });

  it('handles slides with markdown content in body', () => {
    const json = '[{"title":"Math","body":"The formula: $$x^2$$\\n\\n- item 1\\n- item 2"}]';
    const result = parseSlides(json);
    expect(result).toHaveLength(1);
    expect(result![0].body).toContain('$$x^2$$');
  });
});
