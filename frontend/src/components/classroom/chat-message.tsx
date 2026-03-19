import type { Component } from 'solid-js';
import type { AgentMessage } from '../../lib/types';
import AgentAvatar from './agent-avatar';

interface ChatMessageProps {
  message: AgentMessage;
  color?: string;
}

const ChatMessage: Component<ChatMessageProps> = (props) => {
  return (
    <>
      <div class="chat-message">
        <AgentAvatar
          name={props.message.agent_name}
          color={props.color || '#6366f1'}
        />
        <div class="chat-message-body">
          <div class="chat-message-header">
            <span class="chat-message-name">{props.message.agent_name}</span>
            <span class="chat-message-role">{props.message.agent_role}</span>
          </div>
          <div class="chat-message-content">{props.message.content}</div>
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

        .chat-message-content {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </>
  );
};

export default ChatMessage;
