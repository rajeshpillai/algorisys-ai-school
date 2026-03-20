export type RichSegment =
  | { type: 'markdown'; content: string }
  | { type: 'whiteboard'; content: string }
  | { type: 'simulation'; content: string };

const RICH_BLOCK_RE = /(?:~~~|```)(?:whiteboard|simulation)\n([\s\S]*?)\n(?:~~~|```)/g;
const BLOCK_TYPE_RE = /(?:~~~|```)(whiteboard|simulation)/;

/**
 * Parse message content into segments of markdown, whiteboard SVG, and simulation HTML.
 * Incomplete blocks (during streaming) are left as plain markdown.
 */
export function parseRichContent(content: string): RichSegment[] {
  if (!content) return [];

  const segments: RichSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(RICH_BLOCK_RE)) {
    const fullMatch = match[0];
    const innerContent = match[1];
    const startIndex = match.index!;

    // Add preceding markdown if any
    if (startIndex > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, startIndex) });
    }

    // Extract block type from the opening fence
    const typeMatch = fullMatch.match(BLOCK_TYPE_RE);
    const blockType = typeMatch![1] as 'whiteboard' | 'simulation';

    segments.push({ type: blockType, content: innerContent.trim() });

    lastIndex = startIndex + fullMatch.length;
  }

  // Add trailing markdown if any
  if (lastIndex < content.length) {
    segments.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  return segments;
}
