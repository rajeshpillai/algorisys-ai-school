import { API_BASE } from './constants';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getSubjects: () => request('/subjects'),
  getCourse: (id: string) => request(`/courses/${id}`),
  getLesson: (id: string) => request(`/lessons/${id}`),
  startClassroom: (goal: string, learnerProfile?: any, llmConfig?: Record<string, string> | null) =>
    request('/classroom/start', {
      method: 'POST',
      body: JSON.stringify({
        goal,
        learner_profile: learnerProfile,
        ...(llmConfig ? { llm_config: llmConfig } : {}),
      }),
    }),
  sendMessage: (sessionId: string, content: string) =>
    request(`/classroom/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  sendAction: (sessionId: string, action: string) =>
    request(`/classroom/${sessionId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  health: () => request('/health'),
};
