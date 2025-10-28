import { test } from '@playwright/test';

const TEST_URL = 'https://signum-git-story-121-inline-task-cards-levineams-projects.vercel.app';
const TEST_USER = {
  email: 'dev-test-1@signum.dev',
  password: 'DevTest2025!User1'
};

test('debug authentication', async ({ page }) => {
  await page.goto(`${TEST_URL}/auth`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

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
