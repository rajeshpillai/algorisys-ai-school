const STORAGE_KEY = 'llm_settings';

export interface LlmSettings {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey: string;
  ollamaBaseUrl?: string;
}

export function getLlmSettings(): LlmSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearLlmSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasLlmSettings(): boolean {
  return getLlmSettings() !== null;
}

export function getLlmPayload(): Record<string, string> | null {
  const settings = getLlmSettings();
  if (!settings) return null;

  const payload: Record<string, string> = { provider: settings.provider };

  if (settings.provider === 'openai' && settings.apiKey) {
    payload.openai_api_key = settings.apiKey;
  } else if (settings.provider === 'anthropic' && settings.apiKey) {
    payload.anthropic_api_key = settings.apiKey;
  } else if (settings.provider === 'ollama') {
    payload.ollama_base_url = settings.ollamaBaseUrl || 'http://localhost:11434';
  }

  return payload;
}
