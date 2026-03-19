import { test, expect } from '@playwright/test';

test.describe('LLM Settings (BYOK)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any existing settings
    await page.evaluate(() => localStorage.removeItem('llm_settings'));
  });

  test('settings button is visible in top bar', async ({ page }) => {
    const btn = page.locator('.top-bar-settings-btn');
    await expect(btn).toBeVisible();
  });

  test('opens settings modal on click', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await expect(page.locator('.settings-modal')).toBeVisible();
    await expect(page.locator('.settings-title')).toContainText('LLM Settings');
  });

  test('closes modal on overlay click', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await expect(page.locator('.settings-modal')).toBeVisible();

    // Click the overlay (outside modal)
    await page.locator('.settings-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.settings-modal')).not.toBeVisible();
  });

  test('closes modal on close button', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-close').click();
    await expect(page.locator('.settings-modal')).not.toBeVisible();
  });

  test('shows provider dropdown with three options', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    const select = page.locator('.settings-select');
    await expect(select).toBeVisible();

    const options = select.locator('option');
    await expect(options).toHaveCount(3);
  });

  test('shows API key input for OpenAI provider', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-select').selectOption('openai');

    const keyInput = page.locator('.settings-key-row .settings-input');
    await expect(keyInput).toBeVisible();
    await expect(keyInput).toHaveAttribute('type', 'password');
    await expect(keyInput).toHaveAttribute('placeholder', /sk-/);
  });

  test('shows API key input for Anthropic provider', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-select').selectOption('anthropic');

    const keyInput = page.locator('.settings-key-row .settings-input');
    await expect(keyInput).toHaveAttribute('placeholder', /sk-ant/);
  });

  test('shows base URL input for Ollama provider', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-select').selectOption('ollama');

    // Should not show API key row
    await expect(page.locator('.settings-key-row')).not.toBeVisible();
    // Should show URL input
    const urlInput = page.locator('.settings-body .settings-input');
    await expect(urlInput).toBeVisible();
  });

  test('toggle show/hide for API key', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    const keyInput = page.locator('.settings-key-row .settings-input');
    const toggleBtn = page.locator('.settings-toggle-key');

    await expect(keyInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(keyInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(keyInput).toHaveAttribute('type', 'password');
  });

  test('saves settings to localStorage', async ({ page }) => {
    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-select').selectOption('anthropic');
    await page.locator('.settings-key-row .settings-input').fill('sk-ant-test-key');
    await page.locator('.settings-btn-save').click();

    // Verify "Saved" indicator appears
    await expect(page.locator('.settings-saved')).toBeVisible();

    // Verify localStorage
    const stored = await page.evaluate(() => localStorage.getItem('llm_settings'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.provider).toBe('anthropic');
    expect(parsed.apiKey).toBe('sk-ant-test-key');
  });

  test('shows active-keys dot when settings are saved', async ({ page }) => {
    // Set keys in localStorage
    await page.evaluate(() => {
      localStorage.setItem('llm_settings', JSON.stringify({
        provider: 'openai',
        apiKey: 'sk-test',
      }));
    });
    await page.reload();

    await expect(page.locator('.top-bar-settings-dot')).toBeVisible();
  });

  test('clear button removes settings', async ({ page }) => {
    // Pre-set keys
    await page.evaluate(() => {
      localStorage.setItem('llm_settings', JSON.stringify({
        provider: 'openai',
        apiKey: 'sk-test',
      }));
    });
    await page.reload();

    await page.locator('.top-bar-settings-btn').click();
    await page.locator('.settings-btn-clear').click();

    const stored = await page.evaluate(() => localStorage.getItem('llm_settings'));
    expect(stored).toBeNull();
  });

  test('loads existing settings when modal opens', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('llm_settings', JSON.stringify({
        provider: 'anthropic',
        apiKey: 'sk-ant-existing',
      }));
    });
    await page.reload();

    await page.locator('.top-bar-settings-btn').click();
    await expect(page.locator('.settings-select')).toHaveValue('anthropic');
  });
});
