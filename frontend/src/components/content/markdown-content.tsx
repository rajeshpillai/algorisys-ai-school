import type { Component } from 'solid-js';

interface MarkdownContentProps {
  html: string;
}

const MarkdownContent: Component<MarkdownContentProps> = (props) => {
  return (
    <>
      <div class="markdown-content" innerHTML={props.html} />

      <style>{`
        .markdown-content {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--text-primary);
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          color: var(--text-primary);
        }

        .markdown-content h1 { font-size: 1.5rem; }
        .markdown-content h2 { font-size: 1.25rem; }
        .markdown-content h3 { font-size: 1.1rem; }

        .markdown-content p {
          margin-bottom: 1em;
        }

        .markdown-content code {
          background: var(--bg-tertiary);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
        }

        .markdown-content pre {
          background: var(--bg-tertiary);
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 1em;
        }

        .markdown-content pre code {
          background: none;
          padding: 0;
        }

        .markdown-content ul,
        .markdown-content ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .markdown-content li {
          margin-bottom: 0.3em;
        }

        .markdown-content blockquote {
          border-left: 3px solid var(--accent-color);
          padding-left: 1rem;
          color: var(--text-secondary);
          margin-bottom: 1em;
        }
      `}</style>
    </>
  );
};

export default MarkdownContent;
