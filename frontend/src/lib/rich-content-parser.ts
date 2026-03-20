export type RichSegment =
  | { type: 'markdown'; content: string }
  | { type: 'whiteboard'; content: string }
  | { type: 'simulation'; content: string }
  | { type: 'loading'; blockType: 'whiteboard' | 'simulation' };

const RICH_BLOCK_RE = /(?:~~~|```)(?:whiteboard|simulation)\n([\s\S]*?)\n(?:~~~|```)/g;
const BLOCK_TYPE_RE = /(?:~~~|```)(whiteboard|simulation)/;
const UNCLOSED_BLOCK_RE = /(?:~~~|```)(whiteboard|simulation)\n[\s\S]*$/;

/**
 * Parse message content into segments of markdown, whiteboard SVG, and simulation HTML.
 * Incomplete blocks (during streaming) render as loading placeholders.
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

  // Check trailing content for an unclosed block (streaming in progress)
  const trailing = content.slice(lastIndex);
  if (trailing) {
    const unclosedMatch = trailing.match(UNCLOSED_BLOCK_RE);
    if (unclosedMatch) {
      // Add any markdown before the unclosed fence
      const fenceStart = trailing.indexOf(unclosedMatch[0]);
      if (fenceStart > 0) {
        segments.push({ type: 'markdown', content: trailing.slice(0, fenceStart) });
      }
      const blockType = unclosedMatch[1] as 'whiteboard' | 'simulation';
      segments.push({ type: 'loading', blockType });
    } else {
      segments.push({ type: 'markdown', content: trailing });
    }
  }

  return segments;
}
