/**
 * Debug test to see what the homepage looks like after auth
 */

import { test } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'https://signum-git-story-121-inline-task-cards-levineams-projects.vercel.app';

const TEST_USER = {
  email: 'dev-test-1@signum.dev',
  password: 'DevTest2025!User1'
};

test('debug: screenshot homepage after auth', async ({ page }) => {
  await page.goto(`${TEST_URL}/auth`);
  await page.waitForLoadState('networkidle');

  // Fill in login form
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  // Submit form and wait for redirect
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(`${TEST_URL}/`);
  await page.waitForLoadState('networkidle');

  // Wait a bit
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({
    path: 'tests/screenshots/debug-homepage.png',
    fullPage: true
  });

  // Log page content
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  console.log('Has contenteditable:', html.includes('contenteditable'));

  // Check for editor
  const editors = await page.locator('[contenteditable="true"]').count();
  console.log('Number of contenteditable elements:', editors);

  // Check for all contenteditable (including hidden ones)
  const allEditors = await page.locator('[contenteditable]').count();
  console.log('All contenteditable (including hidden):', allEditors);

  if (allEditors > 0) {
    const firstEditor = page.locator('[contenteditable]').first();
    const isVisible = await firstEditor.isVisible();
    const boundingBox = await firstEditor.boundingBox();
    console.log('First editor visible:', isVisible);
    console.log('First editor bounding box:', boundingBox);

    // Try to scroll to it
    await firstEditor.scrollIntoViewIfNeeded().catch(() => console.log('Could not scroll'));
    await page.waitForTimeout(1000);

    // Take another screenshot
    await page.screenshot({
      path: 'tests/screenshots/debug-after-scroll.png',
      fullPage: true
    });

    const isVisibleNow = await firstEditor.isVisible();
    console.log('Editor visible after scroll:', isVisibleNow);
  }

  // Check for journal cards
  const journalCards = await page.locator('[data-entry-id]').count();
  console.log('Journal entry cards:', journalCards);
});
