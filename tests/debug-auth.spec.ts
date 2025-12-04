import { test } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run this debug spec');

test('debug authentication', async ({ page }) => {
  await page.goto(`${TEST_URL}/auth`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(TEST_USER_EMAIL!);
  await passwordInput.fill(TEST_USER_PASSWORD!);

  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(`${TEST_URL}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/debug-after-auth.png', fullPage: true });

  // Check for editor
  const editors = await page.locator('[contenteditable="true"]').count();
  console.log('Number of contenteditable elements:', editors);
  
  if (editors === 0) {
    console.log('No editor found. Checking page state...');
    const pageText = await page.textContent('body');
    console.log('Page contains "journal":', pageText?.toLowerCase().includes('journal'));
    console.log('Page title:', await page.title());
  } else {
    console.log('✅ Found', editors, 'contenteditable element(s)');
  }
});
