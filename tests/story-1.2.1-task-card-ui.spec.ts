import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

/**
 * Story 1.2.1 UI Requirements Test
 *
 * Tests the TaskCard UI improvements:
 * 1. Pending tasks should NOT show "Pending" badge (action buttons indicate status)
 * 2. Accepted tasks should NOT show "Accepted" badge (checkbox indicates status)
 * 3. Checkbox should appear to the LEFT of the title for accepted tasks
 * 4. Edit/Delete buttons with tooltips for accepted tasks
 * 5. Only rejected/cancelled tasks show status badges
 */
test.describe('Story 1.2.1 - TaskCard UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a task and verify pending state UI', async ({ page }) => {
    // Type a task in the journal
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('I need to test the task card UI');
    await editor.press('Enter');

    // Wait for task detection (3 second debounce)
    await page.waitForTimeout(3500);

    // Verify pending task does NOT show "Pending" badge (action buttons make status clear)
    const taskCard = page.locator('[data-task-card]').filter({ hasText: 'test the task card UI' }).first();
    await expect(taskCard.locator('text=Pending')).not.toBeVisible();

    // Verify pending task has accept/edit/reject buttons (these indicate pending status)
    await expect(taskCard.locator('button', { has: page.locator('svg[class*="Check"]') })).toBeVisible();
    await expect(taskCard.locator('button', { has: page.locator('svg[class*="Edit"]') })).toBeVisible();
    await expect(taskCard.locator('button', { has: page.locator('svg[class*="X"]') })).toBeVisible();
  });

  test('Requirement 1: Accepted task should NOT show "Accepted" badge', async ({ page }) => {
    // Create and accept a task
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Task for testing accepted state');
    await editor.press('Enter');
    await page.waitForTimeout(3500);

    // Click accept button (green check)
    const acceptButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /Check/i })
    }).and(page.locator('[class*="text-green"]')).first();
    await acceptButton.click();

    // Wait for state update
    await page.waitForTimeout(500);

    // Verify "Accepted" badge is NOT visible
    const taskCard = page.locator('div').filter({ hasText: 'testing accepted state' }).first();
    await expect(taskCard.locator('text=Accepted')).not.toBeVisible();

    // But "Pending" should also not be visible
    await expect(taskCard.locator('text=Pending')).not.toBeVisible();
  });

  test('Requirement 2: Checkbox should appear to LEFT of title', async ({ page }) => {
    // Create and accept a task
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Task for checkbox position test');
    await editor.press('Enter');
    await page.waitForTimeout(3500);

    // Accept the task
    const acceptButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /Check/i })
    }).and(page.locator('[class*="text-green"]')).first();
    await acceptButton.click();
    await page.waitForTimeout(500);

    // Find the task card
    const taskCard = page.locator('div').filter({ hasText: 'checkbox position test' }).first();

    // Verify checkbox exists
    const checkbox = taskCard.locator('button[aria-label*="Mark as"]').first();
    await expect(checkbox).toBeVisible();

    // Verify checkbox has border styling (indicates it's a checkbox)
    await expect(checkbox).toHaveClass(/border-2/);

    // Get bounding boxes to verify position
    const checkboxBox = await checkbox.boundingBox();
    const titleBox = await taskCard.locator('div').filter({ hasText: 'checkbox position test' }).boundingBox();

    // Checkbox should be to the LEFT of title (checkbox.x < title.x)
    expect(checkboxBox?.x).toBeLessThan(titleBox?.x || Infinity);
  });

  test('Requirement 3: Edit/Delete buttons with tooltips for accepted tasks', async ({ page }) => {
    // Create and accept a task
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Task for button tooltip test');
    await editor.press('Enter');
    await page.waitForTimeout(3500);

    // Accept the task
    const acceptButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /Check/i })
    }).and(page.locator('[class*="text-green"]')).first();
    await acceptButton.click();
    await page.waitForTimeout(500);

    const taskCard = page.locator('div').filter({ hasText: 'button tooltip test' }).first();

    // Verify Edit button exists and has smaller icon
    const editButton = taskCard.locator('button').filter({ has: page.locator('svg[class*="Edit"]') });
    await expect(editButton).toBeVisible();

    // Hover over edit button and verify tooltip
    await editButton.hover();
    await expect(page.locator('text=Edit')).toBeVisible({ timeout: 1000 });

    // Verify Delete button exists with trash icon
    const deleteButton = taskCard.locator('button').filter({ has: page.locator('svg[class*="Trash"]') });
    await expect(deleteButton).toBeVisible();

    // Hover over delete button and verify tooltip
    await deleteButton.hover();
    await expect(page.locator('text=Delete')).toBeVisible({ timeout: 1000 });
  });

  test('Clicking checkbox should toggle completion and strikethrough title', async ({ page }) => {
    // Create and accept a task
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Task for completion toggle test');
    await editor.press('Enter');
    await page.waitForTimeout(3500);

    // Accept the task
    const acceptButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /Check/i })
    }).and(page.locator('[class*="text-green"]')).first();
    await acceptButton.click();
    await page.waitForTimeout(500);

    const taskCard = page.locator('div').filter({ hasText: 'completion toggle test' }).first();
    const checkbox = taskCard.locator('button[aria-label*="Mark as"]').first();
    const title = taskCard.locator('div').filter({ hasText: 'completion toggle test' }).first();

    // Initially checkbox should be empty (not filled)
    await expect(checkbox).not.toHaveClass(/bg-green/);

    // Click checkbox to mark as complete
    await checkbox.click();
    await page.waitForTimeout(500);

    // Checkbox should now be filled with green
    await expect(checkbox).toHaveClass(/bg-green/);
    await expect(checkbox.locator('svg')).toBeVisible(); // Check icon visible

    // Title should have strikethrough
    await expect(title).toHaveClass(/line-through/);

    // Click checkbox again to uncheck
    await checkbox.click();
    await page.waitForTimeout(500);

    // Checkbox should be empty again
    await expect(checkbox).not.toHaveClass(/bg-green/);

    // Title should NOT have strikethrough
    await expect(title).not.toHaveClass(/line-through/);
  });
});
