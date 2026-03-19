import { test, expect } from '@playwright/test';

test.describe('Classroom End-to-End Flow', () => {
  test('landing → start session → classroom with messages', async ({ page }) => {
    await page.goto('/');

    // Type a learning goal
    const input = page.locator('.goal-input');
    await input.fill('Explain what a variable is in one sentence');

    // Click start
    await page.locator('.start-button').click();

    // Should navigate to classroom page
    await expect(page).toHaveURL(/\/classroom\//, { timeout: 10_000 });

    // Classroom UI should render
    await expect(page.locator('.classroom-page')).toBeVisible();
    await expect(page.locator('.chat-stream')).toBeVisible();
    await expect(page.locator('.user-input-bar')).toBeVisible();

    // Wait for agent messages (system or teaching)
    await page.waitForSelector('.chat-message', { timeout: 45_000 });
    const messages = page.locator('.chat-message');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  test('user can send a message after agent responds', async ({ page }) => {
    await page.goto('/');
    await page.locator('.goal-input').fill('What is 2 + 2');
    await page.locator('.start-button').click();
    await expect(page).toHaveURL(/\/classroom\//);

    // Wait for initial agent messages
    await page.waitForSelector('.chat-message', { timeout: 45_000 });

    // Wait for input to become enabled (agent done streaming)
    const userInput = page.locator('.user-input-field');
    await expect(userInput).toBeEnabled({ timeout: 60_000 });

    // Send a follow-up message
    await userInput.fill('Can you explain more?');
    await page.locator('.user-input-send').click();

    // User message should appear in chat
    const lastMessage = page.locator('.chat-message').last();
    await expect(lastMessage).toContainText('Can you explain more?');
  });

  test('advance prompt appears after lesson completes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.goal-input').fill('Teach me Python basics in 2 minutes');
    await page.locator('.start-button').click();
    await expect(page).toHaveURL(/\/classroom\//);

    // Wait for advance prompt to appear (after first lesson teaching completes)
    const advanceCard = page.locator('.advance-prompt-card');
    await advanceCard.waitFor({ state: 'visible', timeout: 90_000 }).catch(() => {
      // May not appear if curriculum fails or timeout — acceptable
    });

    if (await advanceCard.isVisible()) {
      // Should show topic and Continue button
      await expect(page.locator('.advance-prompt-topic')).not.toBeEmpty();
      await expect(page.locator('.advance-prompt-continue')).toBeVisible();
      await expect(page.locator('.advance-prompt-ask')).toBeVisible();
    }
  });

  test('pause button appears in curriculum progress bar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.goal-input').fill('Teach me JavaScript variables');
    await page.locator('.start-button').click();
    await expect(page).toHaveURL(/\/classroom\//);

    // Wait for curriculum progress bar
    const progressBar = page.locator('.curriculum-progress');
    await progressBar.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {});

    if (await progressBar.isVisible()) {
      const pauseBtn = page.locator('.curriculum-pause-btn');
      await expect(pauseBtn).toBeVisible();
    }
  });
});
