import { test, expect } from '@playwright/test';

test.describe('Hyperlink Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the journal stream to load
    await page.waitForSelector('[data-entry-id]', { timeout: 10000 });
  });

  test('should show hyperlinks in both read-only and edit modes', async ({ page }) => {
    // Step 1: Create a new note from "contentment" in Yesterday's entry
    const yesterdayEntry = page.locator('[data-entry-id*="2025"]:has-text("Yesterday")').first();
    await yesterdayEntry.click();

    // Wait for the editor to become active
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Step 2: Select the word "contentment" using JavaScript
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (!editor) return;

      // Find text node containing "contentment"
      const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null
      );

      let textNode: Node | null = null;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent && node.textContent.includes('contentment')) {
          textNode = node;
          break;
        }
      }

      if (!textNode) return;

      const text = textNode.textContent || '';
      const targetWord = 'contentment';
      const startIndex = text.indexOf(targetWord);

      if (startIndex === -1) return;

      // Create and set selection
      const range = document.createRange();
      range.setStart(textNode, startIndex);
      range.setEnd(textNode, startIndex + targetWord.length);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Trigger mouseup event to ensure selection is detected
      const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });
      editor.dispatchEvent(mouseUpEvent);
    });

    // Wait for selection to be processed
    await page.waitForTimeout(200);

    // Step 3: Create the note if "Make Note" button appears
    const makeNoteButton = page.locator('button:has-text("Make Note")');
    const makeNoteVisible = await makeNoteButton.isVisible();

    if (makeNoteVisible) {
      await makeNoteButton.click();

      // Wait for the note creation modal
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Add some content to the note
      const noteContent = page.locator('[role="dialog"] [contenteditable="true"]');
      await noteContent.fill('A state of peaceful happiness and satisfaction.');

      // Save the note
      const saveButton = page.locator('button:has-text("Create Note")');
      await saveButton.click();

      // Wait for modal to close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }

    // Step 4: Exit editing mode by clicking outside (click header which is outside editor)
    await page.locator('header').first().click();
    await page.waitForTimeout(500);

    // Step 5: Verify hyperlink exists in read-only mode
    const linkInReadOnly = await page.evaluate(() => {
      const links = document.querySelectorAll('a[data-note-id]');
      return Array.from(links).some(link => link.textContent === 'contentment');
    });

    // Take a screenshot for verification
    await page.screenshot({
      path: 'test-results/hyperlink-read-only-mode.png',
      fullPage: true
    });

    expect(linkInReadOnly).toBe(true);

    // Step 6: Click the hyperlink in read-only mode
    const readOnlyLink = page.locator('a[data-note-id]:has-text("contentment")').first();
    if (await readOnlyLink.isVisible()) {
      await readOnlyLink.click();

      // Verify note viewer opens
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Close the viewer
      await page.locator('[role="dialog"] button:has-text("Close")').first().click();
    }

    // Step 7: Go back to edit mode and verify hyperlink still works
    await yesterdayEntry.click();
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Take a screenshot for verification
    await page.screenshot({
      path: 'test-results/hyperlink-edit-mode.png',
      fullPage: true
    });

    // Step 8: Verify hyperlink exists in edit mode
    const linkInEditMode = page.locator('a[data-note-id]:has-text("contentment")').first();
    await expect(linkInEditMode).toBeVisible();

    // Click the link in edit mode
    await linkInEditMode.click();

    // Verify note viewer opens in edit mode
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify we can see the note title
    const noteTitle = page.locator('[role="dialog"] h2:has-text("contentment")');
    await expect(noteTitle).toBeVisible();

    console.log('✅ Test completed successfully - hyperlinks work in both modes!');
  });
});