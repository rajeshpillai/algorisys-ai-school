import { getBlockTypePattern } from './rich-block-registry';

export type RichSegment =
  | { type: 'markdown'; content: string }
  | { type: string; content: string; params?: string }
  | { type: 'loading'; blockType: string };

// Build regexes dynamically from the registry
function buildRegexes() {
  const pattern = getBlockTypePattern();
  return {
    richBlock: new RegExp(`(?:~~~|\`\`\`)(${pattern})(?::([^\\n]*))?\\n([\\s\\S]*?)\\n(?:~~~|\`\`\`)`, 'g'),
    unclosedBlock: new RegExp(`(?:~~~|\`\`\`)(${pattern})(?::([^\\n]*))?\\n[\\s\\S]*$`),
  };
}

/**
 * Parse message content into segments of markdown and rich content blocks.
 * Block types are driven by the rich-block-registry — no hardcoded types here.
 * Incomplete blocks (during streaming) render as loading placeholders.
 */
export function parseRichContent(content: string): RichSegment[] {
  if (!content) return [];

  const { richBlock, unclosedBlock } = buildRegexes();
  const segments: RichSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(richBlock)) {
    const fullMatch = match[0];
    const blockType = match[1];
    const params = match[2] || undefined;
    const innerContent = match[3];
    const startIndex = match.index!;

    if (startIndex > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, startIndex) });
    }

    const segment: RichSegment = { type: blockType, content: innerContent.trim() };
    if (params) (segment as any).params = params;
    segments.push(segment);

    lastIndex = startIndex + fullMatch.length;
  }

  // Check trailing content for an unclosed block (streaming in progress)
  const trailing = content.slice(lastIndex);
  if (trailing) {
    const unclosedMatch = trailing.match(unclosedBlock);
    if (unclosedMatch) {
      const fenceStart = trailing.indexOf(unclosedMatch[0]);
      if (fenceStart > 0) {
        segments.push({ type: 'markdown', content: trailing.slice(0, fenceStart) });
      }
      segments.push({ type: 'loading', blockType: unclosedMatch[1] });
    } else {
      segments.push({ type: 'markdown', content: trailing });
    }
  }

  return segments;
}

const WHITEBOARD_SLIDE_DELIMITER = '\n---SLIDE---\n';
const SHORT_MARKDOWN_MAX_LENGTH = 50;

/**
 * Merge consecutive whiteboard segments into a single multi-slide segment.
 * Adjacent whiteboards separated by short markdown (<50 chars) are merged.
 * Content is joined with a delimiter so the adapter can split into slides.
 */
export function mergeConsecutiveWhiteboards(segments: RichSegment[]): RichSegment[] {
  const result: RichSegment[] = [];
  let i = 0;

  while (i < segments.length) {
    const seg = segments[i];

    if (seg.type !== 'whiteboard') {
      result.push(seg);
      i++;
      continue;
    }

    // Start collecting consecutive whiteboards
    const svgs: string[] = [seg.content!];
    let j = i + 1;

    while (j < segments.length) {
      const next = segments[j];

      if (next.type === 'whiteboard') {
        svgs.push(next.content!);
        j++;
      } else if (
        next.type === 'markdown' &&
        next.content!.trim().length < SHORT_MARKDOWN_MAX_LENGTH &&
        j + 1 < segments.length &&
        segments[j + 1].type === 'whiteboard'
      ) {
        // Skip short markdown between whiteboards
        svgs.push(segments[j + 1].content!);
        j += 2;
      } else {
        break;
      }
    }

    if (svgs.length === 1) {
      result.push(seg);
    } else {
      result.push({ type: 'whiteboard', content: svgs.join(WHITEBOARD_SLIDE_DELIMITER) });
    }
    i = j;
  }

  return result;
}
