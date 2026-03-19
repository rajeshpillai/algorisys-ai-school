import { test, expect } from '@playwright/test';

test.describe('Classroom API', () => {
  test('POST /classroom/start requires goal', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('goal');
  });

  test('POST /classroom/start with empty goal returns 400', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /classroom/start with valid goal returns session_id', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Test session' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.session_id).toBeTruthy();
    expect(typeof body.session_id).toBe('string');
  });

  test('POST /classroom/start accepts learner_profile', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: {
        goal: 'Learn Go',
        learner_profile: 'experienced Python developer',
      },
    });
    expect(res.ok()).toBe(true);
  });

  test('POST /classroom/start accepts llm_config (BYOK)', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: {
        goal: 'Test BYOK',
        llm_config: {
          provider: 'openai',
          openai_api_key: 'sk-test-key',
        },
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.session_id).toBeTruthy();
  });

  test('POST /classroom/:id/message requires content', async ({ request }) => {
    const startRes = await request.post('/api/classroom/start', {
      data: { goal: 'Test messages' },
    });
    const { session_id } = await startRes.json();

    const res = await request.post(`/api/classroom/${session_id}/message`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /classroom/:id/action sends action', async ({ request }) => {
    const startRes = await request.post('/api/classroom/start', {
      data: { goal: 'Test actions' },
    });
    const { session_id } = await startRes.json();

    const res = await request.post(`/api/classroom/${session_id}/action`, {
      data: { action: 'continue' },
    });
    expect(res.ok()).toBe(true);
  });

  test('GET /classroom/:id returns session state', async ({ request }) => {
    const startRes = await request.post('/api/classroom/start', {
      data: { goal: 'Test state' },
    });
    const { session_id } = await startRes.json();

    // Small delay for GenServer init
    await new Promise((r) => setTimeout(r, 500));

    const res = await request.get(`/api/classroom/${session_id}`);
    expect(res.ok()).toBe(true);

    const state = await res.json();
    expect(state.id).toBe(session_id);
    expect(state.goal).toBe('Test state');
    expect(['initializing', 'teaching', 'waiting', 'awaiting_advance']).toContain(
      state.state.toString()
    );
  });
});
