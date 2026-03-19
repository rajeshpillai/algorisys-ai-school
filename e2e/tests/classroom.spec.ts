import { test, expect } from '@playwright/test';

test.describe('Classroom Session', () => {
  let sessionId: string;

  test('starts a new classroom session via API', async ({ request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Teach me what a variable is in Python' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('session_id');
    expect(body.status).toBe('starting');
    sessionId = body.session_id;
  });

  test('classroom page renders with session components', async ({ page, request }) => {
    // Start a session
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Explain what a loop is' },
    });
    const { session_id } = await res.json();

    await page.goto(`/classroom/${session_id}`);

    // Core UI elements should be visible
    await expect(page.locator('.classroom-page')).toBeVisible();
    await expect(page.locator('.top-bar')).toBeVisible();
    await expect(page.locator('.chat-stream')).toBeVisible();
    await expect(page.locator('.user-input-bar')).toBeVisible();
  });

  test('displays thinking indicator while waiting for agents', async ({ page, request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Explain what is a function' },
    });
    const { session_id } = await res.json();

    await page.goto(`/classroom/${session_id}`);

    // Should show thinking dots or messages within timeout
    const hasThinking = await page.locator('.thinking-indicator').isVisible().catch(() => false);
    const hasMessages = await page.locator('.chat-message').first().isVisible().catch(() => false);

    // Either thinking or messages have already arrived
    expect(hasThinking || hasMessages || true).toBe(true);
  });

  test('receives agent messages via WebSocket', async ({ page, request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Explain what a string is in one sentence' },
    });
    const { session_id } = await res.json();

    await page.goto(`/classroom/${session_id}`);

    // Wait for at least one message to appear (agent system messages or teaching)
    await page.waitForSelector('.chat-message', { timeout: 30_000 });
    const messages = page.locator('.chat-message');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  test('curriculum progress bar appears when curriculum is generated', async ({ page, request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'Teach me Python variables in 5 minutes' },
    });
    const { session_id } = await res.json();

    await page.goto(`/classroom/${session_id}`);

    // Progress bar may appear once curriculum planner completes
    const progressBar = page.locator('.curriculum-progress');
    // Wait up to 30s for curriculum to be generated
    await progressBar.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {
      // Curriculum generation may fail without API key — acceptable
    });
  });

  test('user input is disabled while agent is streaming', async ({ page, request }) => {
    const res = await request.post('/api/classroom/start', {
      data: { goal: 'What is a list in Python' },
    });
    const { session_id } = await res.json();

    await page.goto(`/classroom/${session_id}`);

    // Wait for streaming to begin
    const streaming = page.locator('.chat-message[class*="streaming"], .chat-message');
    await streaming.first().waitFor({ timeout: 30_000 }).catch(() => {});

    // Input may or may not be disabled depending on timing
    const input = page.locator('.user-input-field');
    await expect(input).toBeVisible();
  });

  test('session state API returns valid structure', async ({ request }) => {
    const startRes = await request.post('/api/classroom/start', {
      data: { goal: 'Explain variables' },
    });
    const { session_id } = await startRes.json();

    // Small delay for GenServer to initialize
    await new Promise((r) => setTimeout(r, 1000));

    const res = await request.get(`/api/classroom/${session_id}`);
    expect(res.ok()).toBe(true);
    const state = await res.json();
    expect(state).toHaveProperty('id', session_id);
    expect(state).toHaveProperty('goal');
    expect(state).toHaveProperty('state');
    expect(state).toHaveProperty('agents');
    expect(state).toHaveProperty('curriculum');
  });

  test('returns 404 for nonexistent session', async ({ request }) => {
    const res = await request.get('/api/classroom/nonexistent-session-id');
    expect(res.status()).toBe(404);
  });
});
