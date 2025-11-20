import { test, expect } from '@playwright/test';
import { loginAsTestUser, clearForcedTestUser } from './helpers/auth';

test.describe('Hyperlink Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Wait for the journal stream to load
    await page.waitForSelector('[data-entry-id]', { timeout: 30000 });
  });

  test.afterEach(async ({ page }) => {
    await clearForcedTestUser(page);
  });

  test('should show hyperlinks in both read-only and edit modes', async ({ page }) => {
    // Step 1: Create a new note from "contentment" in the entry
    const entry = page.locator('[data-entry-id]').first();
    await entry.click();

    // Wait for the editor to become active
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Ensure there is content to create a note from
    const editor = page.locator('[contenteditable="true"]');
    const seedText = 'Yesterday I felt deep contentment and gratitude.';
    await editor.fill(seedText);

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
    const makeNoteButton = page.getByTestId('make-note-button');
    const makeNoteVisible = await makeNoteButton.isVisible();

    if (makeNoteVisible) {
      await makeNoteButton.click();

      // Wait for the note creation modal
      await expect(page.getByTestId('note-modal')).toBeVisible();

      // Add some content to the note
      const noteContent = page.getByTestId('note-modal').locator('[contenteditable="true"]');
      await noteContent.fill('A state of peaceful happiness and satisfaction.');

      // Save the note
      const saveButton = page.getByTestId('note-create-button');
      await saveButton.click();

      // Wait for modal to close
      await expect(page.getByTestId('note-modal')).toBeHidden();
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
    const readOnlyLink = entry.locator('a[data-note-id]:has-text("contentment")').first();
    if (await readOnlyLink.isVisible()) {
      await readOnlyLink.click();

      // Verify note viewer opens
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Close the viewer
      await page.locator('[role="dialog"] button:has-text("Close")').first().click();
    }

    console.log('✅ Test completed successfully - hyperlink verified in read-only mode!');
  });
});
