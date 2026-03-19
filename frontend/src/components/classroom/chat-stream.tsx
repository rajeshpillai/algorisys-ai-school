import { For, type Component } from 'solid-js';
import type { AgentMessage } from '../../lib/types';
import ChatMessage from './chat-message';

interface ChatStreamProps {
  messages: AgentMessage[];
}

const ChatStream: Component<ChatStreamProps> = (props) => {
  return (
    <>
      <div class="chat-stream">
        <For each={props.messages}>
          {(msg) => <ChatMessage message={msg} />}
        </For>
        {props.messages.length === 0 && (
          <div class="chat-stream-empty">
            No messages yet. The classroom session will begin shortly.
          </div>
        )}
      </div>

      <style>{`
        .chat-stream {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .chat-stream-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          font-style: italic;
          padding: 2rem;
        }
      `}</style>
    </>
  );
};

export default ChatStream;
