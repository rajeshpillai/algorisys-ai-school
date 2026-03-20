import { marked } from 'marked';
import katex from 'katex';

/**
 * Render LaTeX expressions within text using KaTeX.
 * Handles $$...$$ (display) and $...$ (inline) delimiters.
 * Runs BEFORE markdown parsing to avoid conflict with markdown syntax.
 */
function renderLatex(text: string): string {
  // Display math: $$...$$  (must come first to avoid $...$ matching)
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return _match;
    }
  });

  // Inline math: $...$  (but not $$)
  // Negative lookbehind/ahead for $ to avoid matching already-processed display math
  text = text.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return _match;
    }
  });

  // Also handle \[...\] (display) and \(...\) (inline) delimiters
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return _match;
    }
  });

  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return _match;
    }
  });

  return text;
}

/**
 * Render markdown content with LaTeX support.
 * LaTeX is rendered first, then markdown parses the result.
 */
export function renderMarkdown(content: string): string {
  try {
    const withLatex = renderLatex(content);
    return marked.parse(withLatex, { async: false }) as string;
  } catch {
    return content;
  }
}
