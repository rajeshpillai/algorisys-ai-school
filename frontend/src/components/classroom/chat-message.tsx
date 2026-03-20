import { Show, For, Suspense, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { AgentMessage } from '../../lib/types';
import { renderMarkdown } from '../../lib/markdown-renderer';
import { parseRichContent } from '../../lib/rich-content-parser';
import { getBlockDefinition, getLoadingMessage } from '../../lib/rich-block-registry';
import AgentAvatar from './agent-avatar';

interface ChatMessageProps {
  message: AgentMessage;
  color?: string;
  isStreaming?: boolean;
}

const ChatMessage: Component<ChatMessageProps> = (props) => {
  const isUser = () => props.message.agent_role === 'learner';

  const cleanContent = () =>
    props.message.content.replace(/\[SCENE_COMPLETE\]/g, '').trimEnd();

  const segments = () => parseRichContent(cleanContent());

  const renderSegment = (segment: { type: string; content?: string; blockType?: string }) => {
    if (segment.type === 'markdown') {
      return <div class="chat-message-content" innerHTML={renderMarkdown(segment.content!)} />;
    }
    if (segment.type === 'loading') {
      return (
        <div class="rich-content-loading">
          <div class="rich-content-loading-spinner" />
          <span>{getLoadingMessage(segment.blockType!)}</span>
        </div>
      );
    }
    // Look up component from registry
    const def = getBlockDefinition(segment.type);
    if (def) {
      return (
        <Suspense fallback={
          <div class="rich-content-loading">
            <div class="rich-content-loading-spinner" />
            <span>{def.loadingMessage}</span>
          </div>
        }>
          <Dynamic component={def.component} content={segment.content!} />
        </Suspense>
      );
    }
    // Unknown block type — render as markdown fallback
    return <div class="chat-message-content" innerHTML={renderMarkdown(segment.content || '')} />;
  };

  return (
    <>
      <div
        class="chat-message"
        classList={{
          'chat-message--user': isUser(),
          'chat-message--streaming': props.isStreaming,
        }}
      >
        <AgentAvatar
          name={props.message.agent_name}
          color={isUser() ? '#64748b' : (props.color || '#6366f1')}
        />
        <div class="chat-message-body">
          <div class="chat-message-header">
            <span class="chat-message-name">{props.message.agent_name}</span>
            <Show when={props.message.agent_role && !isUser()}>
              <span class="chat-message-role">{props.message.agent_role}</span>
            </Show>
            <Show when={props.isStreaming}>
              <span class="chat-message-streaming-badge">streaming</span>
            </Show>
          </div>
          <For each={segments()}>
            {(segment) => renderSegment(segment as any)}
          </For>
        </div>
      </div>

      <style>{`
        .chat-message {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          transition: background-color 0.15s;
        }

        .chat-message:hover {
          background: var(--bg-tertiary);
        }

        .chat-message--user {
          background: var(--bg-secondary);
        }

        .chat-message--streaming {
          border-left: 3px solid var(--accent-color);
        }

        .chat-message-body {
          flex: 1;
          min-width: 0;
        }

        .chat-message-header {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .chat-message-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .chat-message-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .chat-message-streaming-badge {
          font-size: 0.65rem;
          color: var(--accent-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .chat-message-content {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          word-break: break-word;
        }

        .chat-message-content p {
          margin: 0 0 0.5rem;
        }

        .chat-message-content p:last-child {
          margin-bottom: 0;
        }

        .chat-message-content pre {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.75rem;
          overflow-x: auto;
          font-size: 0.85rem;
          margin: 0.5rem 0;
        }

        .chat-message-content code {
          background: var(--bg-tertiary);
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-size: 0.85em;
        }

        .chat-message-content pre code {
          background: none;
          padding: 0;
        }

        .chat-message-content ul,
        .chat-message-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .chat-message-content li {
          margin-bottom: 0.25rem;
        }

        .chat-message-content h1,
        .chat-message-content h2,
        .chat-message-content h3 {
          margin: 0.75rem 0 0.5rem;
          color: var(--text-primary);
        }

        .chat-message-content blockquote {
          border-left: 3px solid var(--border-color);
          margin: 0.5rem 0;
          padding: 0.25rem 0.75rem;
          color: var(--text-muted);
        }

        .chat-message-content .katex-display {
          margin: 0.75rem 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.5rem 0;
        }

        .chat-message-content .katex {
          font-size: 1.05em;
        }

        .rich-content-loading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0.75rem 0;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .rich-content-loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-color);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: rich-loading-spin 0.8s linear infinite;
        }

        @keyframes rich-loading-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ChatMessage;
