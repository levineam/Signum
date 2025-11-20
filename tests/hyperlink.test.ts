import { test, expect } from '@playwright/test';
import { loginAsTestUser, clearForcedTestUser } from './helpers/auth';

test.describe('Hyperlink Creation from Selected Text', () => {
  test.beforeEach(async ({ page }) => {
    // Login first to enable note creation
    await loginAsTestUser(page);

    // Navigate to the application (login redirects to /, but good to be explicit or ensure we are there)
    // await page.goto('/'); // loginAsTestUser already waits for /

    // Wait for the journal stream to load
    await page.waitForSelector('[data-entry-id]', { timeout: 30000 });
  });

  test.afterEach(async ({ page }) => {
    await clearForcedTestUser(page);
  });

  test('should create hyperlink from selected text and open note viewer', async ({ page }) => {
    // Step 1: Click on today's entry to start editing
    // In guest mode, ID is 'guest-entry', so we use a generic selector
    const todayEntry = page.locator('[data-entry-id]').first();
    await todayEntry.click();

    // Wait for the editor to become active
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Step 2: Type some text with a word we'll make into a note
    const testText = 'I am feeling contentment today and it brings me peace.';
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill(testText);

    // Step 3: Select the word "contentment" using JavaScript
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (!editor) return;

      const textNode = editor.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

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

    // Wait a bit for the selection to be processed
    await page.waitForTimeout(100);

    // Step 4: Wait for and click the "Make Note" button
    const makeNoteButton = page.getByTestId('make-note-button');
    await expect(makeNoteButton).toBeVisible({ timeout: 5000 });
    await makeNoteButton.click();

    // Step 5: Wait for the note creation modal
    await expect(page.getByTestId('note-modal')).toBeVisible();

    // Verify the selected text appears as the title
    const titleInput = page.locator('input#note-title');
    await expect(titleInput).toHaveValue('contentment');

    // Step 6: Add some content to the note
    const noteContent = page.getByTestId('note-modal').locator('[contenteditable="true"]');
    await noteContent.fill('Contentment is a state of satisfaction and peace.');

    // Step 7: Save the note
    const saveButton = page.getByTestId('note-create-button');
    await saveButton.click();

    // Wait for modal to close
    await expect(page.getByTestId('note-modal')).toBeHidden({ timeout: 5000 });

    // Wait for the link to be inserted into the editor
    await page.waitForSelector('a[data-note-id]:has-text("contentment")', { timeout: 10000 });

    // Step 8: Exit editing mode by clicking outside (click header which is outside editor)
    await page.locator('header').first().click();

    // Wait a bit for the view to update
    await page.waitForTimeout(500);

    // Step 9: Verify the hyperlink exists in read-only mode
    const linkInReadOnly = page.locator('a[data-note-id]:has-text("contentment")');
    await expect(linkInReadOnly).toBeVisible();

    // Step 10: Click back into editing mode and ensure link persists
    await todayEntry.click();
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Step 11: Verify the hyperlink is still visible in editing mode
    await expect(page.locator('a[data-note-id]:has-text("contentment")')).toBeVisible();
  });

  test('should create multiple hyperlinks in the same entry', async ({ page }) => {
    // Step 1: Click on today's entry to start editing
    const todayEntry = page.locator('[data-entry-id]').first();
    await todayEntry.click();

    // Wait for the editor to become active
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Step 2: Type text with multiple words to link
    const testText = 'My journey involves mindfulness and gratitude daily.';
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill(testText);

    // Step 3: Create first note for "mindfulness"
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (!editor) return;

      const textNode = editor.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

      const text = textNode.textContent || '';
      const targetWord = 'mindfulness';
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

    await page.waitForTimeout(100);

    const makeNoteButton = page.getByTestId('make-note-button');
    await expect(makeNoteButton).toBeVisible();
    await makeNoteButton.click();

    await expect(page.getByTestId('note-modal')).toBeVisible();

    // Add content to the note
    const noteContent = page.getByTestId('note-modal').locator('[contenteditable="true"]');
    await noteContent.fill('Mindfulness is the practice of being present in the moment.');

    const saveButton = page.getByTestId('note-create-button');
    await saveButton.click();
    await expect(page.getByTestId('note-modal')).toBeHidden({ timeout: 5000 });
    await page.waitForSelector('a[data-note-id]:has-text("mindfulness")', { timeout: 10000 });

    // Step 4: Create second note for "gratitude"
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (!editor) return;

      // After first note creation, content might have changed - need to find text node again
      const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null
      );

      let textNode: Node | null = null;
      let text = '';

      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent && node.textContent.includes('gratitude')) {
          textNode = node;
          text = node.textContent;
          break;
        }
      }

      if (!textNode) return;

      const targetWord = 'gratitude';
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

    await page.waitForTimeout(100);

    await expect(makeNoteButton).toBeVisible();
    await makeNoteButton.click();

    await expect(page.getByTestId('note-modal')).toBeVisible();

    // Add content for gratitude note
    await noteContent.fill('Gratitude is the quality of being thankful and appreciative.');

    await saveButton.click();
    await expect(page.getByTestId('note-modal')).toBeHidden({ timeout: 5000 });
    await page.waitForSelector('a[data-note-id]:has-text("gratitude")', { timeout: 10000 });

    // Step 5: Exit editing mode (click header which is outside editor)
    await page.locator('header').first().click();

    // Wait a bit for the view to update
    await page.waitForTimeout(500);

    // Step 6: Verify both hyperlinks exist
    await expect(page.locator('a[data-note-id]:has-text("mindfulness")')).toBeVisible();
    await expect(page.locator('a[data-note-id]:has-text("gratitude")')).toBeVisible();

    // Step 7: Re-enter edit mode and ensure both links persist
    await todayEntry.click();
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });
    await expect(page.locator('a[data-note-id]:has-text("mindfulness")')).toBeVisible();
    await expect(page.locator('a[data-note-id]:has-text("gratitude")')).toBeVisible();
  });
});
