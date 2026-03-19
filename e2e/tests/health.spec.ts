import { test, expect } from '@playwright/test';

test.describe('Health & Infrastructure', () => {
  test('backend health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('frontend serves the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*School.*/i);
  });

  test('frontend proxies API calls to backend', async ({ request }) => {
    const res = await request.get('/api/subjects');
    expect(res.ok()).toBe(true);
  });
});
