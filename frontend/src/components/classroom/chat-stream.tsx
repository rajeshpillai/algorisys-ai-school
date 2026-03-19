import { For, Show, createEffect, type Component } from 'solid-js';
import type { AgentMessage, AgentRole } from '../../lib/types';
import ChatMessage from './chat-message';

interface ChatStreamProps {
  messages: AgentMessage[];
  streamingAgent: string | null;
  streamingContent: string;
  agents: AgentRole[];
}

const ChatStream: Component<ChatStreamProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    if (containerRef) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  };

  createEffect(() => {
    props.messages.length;
    props.streamingContent;
    scrollToBottom();
  });

  const getAgentColor = (name: string): string => {
    const agent = props.agents.find((a) => a.name === name);
    return agent?.color || '#6366f1';
  };

  const isWaiting = () =>
    props.messages.length === 0 && !props.streamingAgent;

  return (
    <>
      <div class="chat-stream" ref={containerRef}>
        <Show when={isWaiting()}>
          <div class="chat-stream-empty">
            <div class="thinking-indicator">
              <span class="thinking-dot" />
              <span class="thinking-dot" />
              <span class="thinking-dot" />
            </div>
            <span class="thinking-text">Thinking...</span>
          </div>
        </Show>

        <For each={props.messages}>
          {(msg) => (
            <ChatMessage
              message={msg}
              color={getAgentColor(msg.agent_name)}
            />
          )}
        </For>

        <Show when={props.streamingAgent && props.streamingContent}>
          <ChatMessage
            message={{
              id: '__streaming__',
              agent_name: props.streamingAgent!,
              agent_role: '',
              content: props.streamingContent,
              timestamp: Date.now(),
            }}
            color={getAgentColor(props.streamingAgent!)}
            isStreaming={true}
          />
        </Show>
      </div>

      <style>{`
        .chat-stream {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .chat-stream-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 0.75rem;
          color: var(--text-muted);
        }

        .thinking-indicator {
          display: flex;
          gap: 0.35rem;
        }

        .thinking-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: thinking-bounce 1.2s infinite ease-in-out;
        }

        .thinking-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinking-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        .thinking-text {
          font-size: 0.85rem;
          font-style: italic;
        }
      `}</style>
    </>
  );
};

export default ChatStream;
