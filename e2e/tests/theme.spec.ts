import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the theme toggle button', async ({ page }) => {
    const toggle = page.locator('.theme-toggle');
    await expect(toggle).toBeVisible();
  });

  test('toggles dark class on html element', async ({ page }) => {
    const html = page.locator('html');
    const toggle = page.locator('.theme-toggle');

    // Get initial state
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Click toggle
    await toggle.click();
    const afterToggle = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterToggle).not.toBe(initialDark);

    // Click again to restore
    await toggle.click();
    const afterRestore = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterRestore).toBe(initialDark);
  });
});
