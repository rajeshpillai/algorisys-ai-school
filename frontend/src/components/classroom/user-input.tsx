import { createSignal, type Component } from 'solid-js';

interface UserInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const UserInput: Component<UserInputProps> = (props) => {
  const [text, setText] = createSignal('');

  const handleSend = () => {
    const msg = text().trim();
    if (!msg || props.disabled) return;
    props.onSend(msg);
    setText('');
  };

  return (
    <>
      <div class="user-input-bar">
        <input
          type="text"
          class="user-input-field"
          placeholder={props.placeholder || 'Type a message...'}
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={props.disabled}
        />
        <button
          class="user-input-send"
          onClick={handleSend}
          disabled={props.disabled || !text().trim()}
        >
          Send
        </button>
      </div>

      <style>{`
        .user-input-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-primary);
        }

        .user-input-field {
          flex: 1;
          padding: 0.6rem 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 0.9rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }

        .user-input-field:focus {
          border-color: var(--accent-color);
        }

        .user-input-field::placeholder {
          color: var(--text-muted);
        }

        .user-input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .user-input-send {
          padding: 0.6rem 1.25rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .user-input-send:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .user-input-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default UserInput;
