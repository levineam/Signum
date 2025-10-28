import { Page } from '@playwright/test';

/**
 * Login as Test User 1 from dev-test-credentials.md
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.getByRole('textbox', { name: /email/i }).fill('dev-test-1@signum.dev');
  await page.getByRole('textbox', { name: /password/i }).fill('DevTest2025!User1');

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to home page
  await page.waitForURL('/');
  await page.waitForLoadState('networkidle');
}
