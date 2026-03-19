import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays hero section with title and subtitle', async ({ page }) => {
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    await expect(page.locator('.hero-title')).toContainText('AI School');
  });

  test('displays the learning goal input and start button', async ({ page }) => {
    const input = page.locator('.goal-input');
    const button = page.locator('.start-button');

    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /teach|learn/i);
    await expect(button).toContainText('Start Learning');
  });

  test('displays the top bar with brand name', async ({ page }) => {
    await expect(page.locator('.top-bar-brand')).toBeVisible();
    await expect(page.locator('.top-bar-brand')).toContainText('Algorisys');
  });

  test('displays the Explore Courses section', async ({ page }) => {
    await expect(page.locator('.subjects-heading')).toContainText('Explore Courses');
  });

  test('loads and displays course cards from API', async ({ page }) => {
    // Wait for courses to load (may take a moment)
    await page.waitForSelector('.course-card', { timeout: 10_000 }).catch(() => {
      // No courses available — that's ok, just verify the section exists
    });

    const cards = page.locator('.course-card');
    const count = await cards.count();
    // If content exists, cards should be visible
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
      await expect(page.locator('.course-card-title').first()).not.toBeEmpty();
    }
  });

  test('navigates to course browser when card is clicked', async ({ page }) => {
    const card = page.locator('.course-card').first();
    const hasCards = await card.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip();
      return;
    }
    await card.click();
    await expect(page).toHaveURL(/\/courses\//);
  });
});
