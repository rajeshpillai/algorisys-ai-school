import { createSignal, Show, type Component } from 'solid-js';
import {
  getLlmSettings,
  saveLlmSettings,
  clearLlmSettings,
  type LlmSettings,
} from '../../lib/llm-settings';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: Component<SettingsModalProps> = (props) => {
  const existing = getLlmSettings();
  const [provider, setProvider] = createSignal<LlmSettings['provider']>(
    existing?.provider || 'openai'
  );
  const [apiKey, setApiKey] = createSignal(existing?.apiKey || '');
  const [ollamaUrl, setOllamaUrl] = createSignal(
    existing?.ollamaBaseUrl || 'http://localhost:11434'
  );
  const [showKey, setShowKey] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  const handleSave = () => {
    saveLlmSettings({
      provider: provider(),
      apiKey: apiKey(),
      ollamaBaseUrl: ollamaUrl(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearLlmSettings();
    setApiKey('');
    setOllamaUrl('http://localhost:11434');
    setSaved(false);
  };

  return (
    <>
      <div class="settings-overlay" onClick={() => props.onClose()}>
        <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div class="settings-header">
            <h3 class="settings-title">LLM Settings</h3>
            <button class="settings-close" onClick={() => props.onClose()}>
              &times;
            </button>
          </div>

          <div class="settings-body">
            <p class="settings-desc">
              Bring your own API key. Keys are stored in your browser only.
            </p>

            <label class="settings-label">Provider</label>
            <select
              class="settings-select"
              value={provider()}
              onChange={(e) => setProvider(e.currentTarget.value as LlmSettings['provider'])}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (local)</option>
            </select>

            <Show when={provider() !== 'ollama'}>
              <label class="settings-label">API Key</label>
              <div class="settings-key-row">
                <input
                  type={showKey() ? 'text' : 'password'}
                  class="settings-input"
                  placeholder={provider() === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  value={apiKey()}
                  onInput={(e) => setApiKey(e.currentTarget.value)}
                />
                <button
                  class="settings-toggle-key"
                  onClick={() => setShowKey(!showKey())}
                >
                  {showKey() ? 'Hide' : 'Show'}
                </button>
              </div>
            </Show>

            <Show when={provider() === 'ollama'}>
              <label class="settings-label">Ollama Base URL</label>
              <input
                type="text"
                class="settings-input"
                placeholder="http://localhost:11434"
                value={ollamaUrl()}
                onInput={(e) => setOllamaUrl(e.currentTarget.value)}
              />
            </Show>
          </div>

          <div class="settings-footer">
            <button class="settings-btn-clear" onClick={handleClear}>
              Clear
            </button>
            <div class="settings-footer-right">
              <Show when={saved()}>
                <span class="settings-saved">Saved</span>
              </Show>
              <button class="settings-btn-save" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .settings-modal {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          width: 420px;
          max-width: 90vw;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .settings-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .settings-close {
          background: none;
          border: none;
          font-size: 1.4rem;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .settings-close:hover {
          color: var(--text-primary);
        }

        .settings-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .settings-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0 0 0.5rem;
        }

        .settings-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .settings-select,
        .settings-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.85rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .settings-select:focus,
        .settings-input:focus {
          border-color: var(--accent-color);
        }

        .settings-key-row {
          display: flex;
          gap: 0.5rem;
        }

        .settings-key-row .settings-input {
          flex: 1;
        }

        .settings-toggle-key {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          flex-shrink: 0;
        }

        .settings-toggle-key:hover {
          border-color: var(--text-secondary);
        }

        .settings-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .settings-footer-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .settings-saved {
          font-size: 0.8rem;
          color: var(--accent-color);
          font-weight: 500;
        }

        .settings-btn-save {
          padding: 0.45rem 1.25rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .settings-btn-save:hover {
          background: var(--accent-hover);
        }

        .settings-btn-clear {
          padding: 0.45rem 1rem;
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .settings-btn-clear:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }
      `}</style>
    </>
  );
};

export default SettingsModal;
