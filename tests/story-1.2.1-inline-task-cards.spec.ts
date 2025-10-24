/**
 * E2E tests for Story 1.2.1: Inline Task Cards
 * Tests the TaskCard component UI and interactions
 *
 * NOTE: These are integration tests that require a running server.
 * Set TEST_URL environment variable to test against a specific deployment.
 *
 * Example:
 *   TEST_URL=http://localhost:3000 npx playwright test story-1.2.1
 *   TEST_URL=https://your-preview.vercel.app npx playwright test story-1.2.1
 */

import { test, expect } from '@playwright/test';

// Use environment variable or skip tests
const TEST_URL = process.env.TEST_URL || process.env.PLAYWRIGHT_BASE_URL;

// Test credentials from /docs/dev-test-credentials.md
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'dev-test-1@signum.dev',
  password: process.env.TEST_USER_PASSWORD || 'DevTest2025!User1'
};

// Skip all tests if no test URL is provided
const skipTests = !TEST_URL;
if (skipTests) {
  console.warn('⚠️  Skipping Story 1.2.1 E2E tests: TEST_URL not set');
  console.warn('   Set TEST_URL=http://localhost:3000 to run tests locally');
}

// Helper to authenticate user
async function authenticateUser(page: any) {
  if (!TEST_URL) {
    throw new Error('TEST_URL is not set');
  }

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

  // Wait for journal to load
  await page.waitForTimeout(2000);
}

// Helper to get journal editor and wait for it to be ready
async function getJournalEditor(page: any) {
  // Wait for journal entries to load
  await page.waitForSelector('[data-entry-id]', { timeout: 10000 });

  // First, click on the journal entry card to enter edit mode
  // Journal entries are displayed in read-only mode by default
  const entryCard = page.locator('[data-entry-id]').first();
  await entryCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500); // Wait for scroll animation

  // Click specifically on the clickable area (not on a link inside it)
  const clickableArea = entryCard.locator('.cursor-text').first();
  await clickableArea.click();

  // Now wait for the contenteditable editor to appear within the clicked card
  const editor = entryCard.locator('[contenteditable="true"]').or(entryCard.locator('div[contenteditable]'));
  await editor.waitFor({ state: 'visible', timeout: 10000 });
  return editor;
}

test.describe('Story 1.2.1: TaskCard Display', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should display TaskCard after creating task in journal', async ({ page }) => {
    await authenticateUser(page);

    // Get the journal editor
    const editor = await getJournalEditor(page);
    await editor.click();

    // Type a task with a date
    const taskText = `Test task: call mom tomorrow at 3pm (${Date.now()})`;
    await editor.fill(taskText);

    // Wait for task detection (3 second delay)
    await page.waitForTimeout(4000);

    // Check for toast notification
    const toast = page.locator('text=/Task created/i');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Wait a bit more for TaskCard to render
    await page.waitForTimeout(1000);

    // Look for TaskCard component (it will be the last card with this text)
    const taskCard = page.locator('[data-slot="card"]').filter({ hasText: /Tomorrow at 3:00 PM/i }).last();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    // Verify TaskCard has the date displayed
    await expect(taskCard).toContainText(/Tomorrow/i);
    await expect(taskCard).toContainText(/3:00 PM/i);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-task-card-displayed.png',
      fullPage: true
    });
  });

  test('should show recurring indicator for recurring tasks', async ({ page }) => {
    await authenticateUser(page);

    const editor = await getJournalEditor(page);
    await editor.click();

    // Type a recurring task
    const taskText = `Recurring task: team standup every Monday at 9am (${Date.now()})`;
    await editor.fill(taskText);

    // Wait for task detection
    await page.waitForTimeout(4000);

    // Check for toast
    const toast = page.locator('text=/Task created/i');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Wait for TaskCard
    await page.waitForTimeout(1000);

    // Look for recurring indicator
    const taskCard = page.locator('[data-slot="card"]').last();
    await expect(taskCard).toContainText(/Recurring/i);

    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-recurring-task.png',
      fullPage: true
    });
  });

  test('should show pending status badge', async ({ page }) => {
    await authenticateUser(page);

    const editor = await getJournalEditor(page);
    await editor.click();

    const taskText = `Status test: review docs next Friday (${Date.now()})`;
    await editor.fill(taskText);

    await page.waitForTimeout(4000);

    // Wait for toast
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check for pending badge
    const pendingBadge = page.locator('text=/Pending/i').last();
    await expect(pendingBadge).toBeVisible();
  });
});

test.describe('Story 1.2.1: TaskCard Actions - Accept', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should accept task and update status', async ({ page }) => {
    await authenticateUser(page);

    // Create a task
    const editor = await getJournalEditor(page);
    await editor.click();

    const taskText = `Accept test: buy groceries tomorrow (${Date.now()})`;
    await editor.fill(taskText);

    // Wait for task to be created
    await page.waitForTimeout(4000);
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Find the accept button (green checkmark)
    const acceptButton = page.locator('button').filter({ hasText: '' }).first();

    // Click accept
    await acceptButton.click();

    // Wait for success toast
    const acceptToast = page.locator('text=/Task accepted/i');
    await expect(acceptToast).toBeVisible({ timeout: 3000 });

    // Verify status badge changed to Accepted
    const acceptedBadge = page.locator('text=/Accepted/i').last();
    await expect(acceptedBadge).toBeVisible({ timeout: 3000 });

    // Verify action buttons are hidden
    await expect(acceptButton).not.toBeVisible({ timeout: 2000 });

    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-task-accepted.png',
      fullPage: true
    });
  });
});

test.describe('Story 1.2.1: TaskCard Actions - Reject', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should reject task and remove from view', async ({ page }) => {
    await authenticateUser(page);

    // Create a task
    const editor = await getJournalEditor(page);
    await editor.click();

    const taskText = `Reject test: unwanted reminder (${Date.now()})`;
    await editor.fill(taskText);

    // Wait for task to be created
    await page.waitForTimeout(4000);
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Find the TaskCard before rejecting
    const taskCard = page.locator('[data-slot="card"]').last();
    await expect(taskCard).toBeVisible();

    // Find and click the reject button (red X)
    const rejectButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: '' })
    }).last();

    await rejectButton.click();

    // Wait for rejection toast
    const rejectToast = page.locator('text=/Task rejected and deleted/i');
    await expect(rejectToast).toBeVisible({ timeout: 3000 });

    // Verify TaskCard is removed
    await expect(taskCard).not.toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-task-rejected.png',
      fullPage: true
    });
  });
});

test.describe('Story 1.2.1: TaskCard Actions - Edit', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should show "coming soon" message when editing', async ({ page }) => {
    await authenticateUser(page);

    // Create a task
    const editor = await getJournalEditor(page);
    await editor.click();

    const taskText = `Edit test: task to edit (${Date.now()})`;
    await editor.fill(taskText);

    // Wait for task to be created
    await page.waitForTimeout(4000);
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Find the edit button (pencil icon)
    const editButton = page.locator('button').filter({
      has: page.locator('svg')
    }).nth(1); // Second button is edit

    await editButton.click();

    // Wait for "coming soon" toast
    const comingSoonToast = page.locator('text=/coming soon/i');
    await expect(comingSoonToast).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Story 1.2.1: TaskCard Persistence', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should persist tasks across page reloads', async ({ page }) => {
    await authenticateUser(page);

    // Create a unique task
    const uniqueText = `Persistence test ${Date.now()}`;
    const editor = await getJournalEditor(page);
    await editor.click();
    await editor.fill(`Task: ${uniqueText} tomorrow at 2pm`);

    // Wait for task to be created
    await page.waitForTimeout(4000);
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });

    // Wait for task to be saved to metadata
    await page.waitForTimeout(2000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify TaskCard reappears
    const taskCard = page.locator('[data-slot="card"]').filter({ hasText: /Tomorrow at 2:00 PM/i });
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-task-persisted.png',
      fullPage: true
    });
  });

  test('should preserve accepted status after reload', async ({ page }) => {
    await authenticateUser(page);

    // Create a task
    const uniqueText = `Status persistence ${Date.now()}`;
    const editor = await getJournalEditor(page);
    await editor.click();
    await editor.fill(`Task: ${uniqueText} next week`);

    // Wait for task creation
    await page.waitForTimeout(4000);
    await page.waitForSelector('text=/Task created/i', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Accept the task
    const acceptButton = page.locator('button').filter({ hasText: '' }).first();
    await acceptButton.click();
    await page.waitForSelector('text=/Task accepted/i', { timeout: 3000 });

    // Wait for state to save
    await page.waitForTimeout(2000);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify accepted badge persists
    const acceptedBadge = page.locator('text=/Accepted/i').last();
    await expect(acceptedBadge).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Story 1.2.1: Multiple Tasks', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should display multiple TaskCards in same entry', async ({ page }) => {
    await authenticateUser(page);

    const editor = await getJournalEditor(page);
    await editor.click();

    // Type multiple task paragraphs
    const tasks = [
      `Task 1: call dentist tomorrow (${Date.now()})`,
      `Task 2: buy groceries next Monday (${Date.now() + 1})`,
      `Task 3: submit report on Friday (${Date.now() + 2})`
    ];

    await editor.fill(tasks.join('\n\n'));

    // Wait for all tasks to be detected (3 seconds + 1 second buffer)
    await page.waitForTimeout(5000);

    // Count TaskCards
    const taskCards = page.locator('[data-slot="card"]');
    const count = await taskCards.count();

    // Should have at least 3 task cards (may have more from previous tests)
    expect(count).toBeGreaterThanOrEqual(3);

    await page.screenshot({
      path: 'tests/screenshots/story-1.2.1-multiple-tasks.png',
      fullPage: true
    });
  });
});
