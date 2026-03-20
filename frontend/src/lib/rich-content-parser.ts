import { getBlockTypePattern } from './rich-block-registry';

export type RichSegment =
  | { type: 'markdown'; content: string }
  | { type: string; content: string }
  | { type: 'loading'; blockType: string };

// Build regexes dynamically from the registry
function buildRegexes() {
  const pattern = getBlockTypePattern();
  return {
    richBlock: new RegExp(`(?:~~~|\`\`\`)(?:${pattern})\\n([\\s\\S]*?)\\n(?:~~~|\`\`\`)`, 'g'),
    blockType: new RegExp(`(?:~~~|\`\`\`)(${pattern})`),
    unclosedBlock: new RegExp(`(?:~~~|\`\`\`)(${pattern})\\n[\\s\\S]*$`),
  };
}

/**
 * Parse message content into segments of markdown and rich content blocks.
 * Block types are driven by the rich-block-registry — no hardcoded types here.
 * Incomplete blocks (during streaming) render as loading placeholders.
 */
export function parseRichContent(content: string): RichSegment[] {
  if (!content) return [];

  const { richBlock, blockType: blockTypeRe, unclosedBlock } = buildRegexes();
  const segments: RichSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(richBlock)) {
    const fullMatch = match[0];
    const innerContent = match[1];
    const startIndex = match.index!;

    if (startIndex > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, startIndex) });
    }

    const typeMatch = fullMatch.match(blockTypeRe);
    const blockType = typeMatch![1];

    segments.push({ type: blockType, content: innerContent.trim() });

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
