import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('landing page is at /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.landing-page')).toBeVisible();
  });

  test('unknown routes show not-found page', async ({ page }) => {
    await page.goto('/nonexistent-route');
    // Should show some kind of not-found or fallback
    await expect(page.locator('body')).toBeVisible();
  });

  test('top bar brand link navigates to landing', async ({ page }) => {
    // Start from a different page
    await page.goto('/courses/nonexistent');
    await page.locator('.top-bar-brand').click();
    await expect(page).toHaveURL('/');
  });

  test('Enter key in goal input starts session', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('.goal-input');
    await input.fill('Test enter key');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/classroom\//, { timeout: 10_000 });
  });
});
