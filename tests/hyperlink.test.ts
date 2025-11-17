import { test, expect } from '@playwright/test';

test.describe('Hyperlink Creation from Selected Text', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the journal stream to load
    await page.waitForSelector('[data-entry-id]', { timeout: 10000 });
  });

  test('should create hyperlink from selected text and open note viewer', async ({ page }) => {
    // Step 1: Click on today's entry to start editing
    const todayEntry = page.locator('[data-entry-id*="2025"]').first();
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
    const makeNoteButton = page.locator('button:has-text("Make Note")');
    await expect(makeNoteButton).toBeVisible({ timeout: 5000 });
    await makeNoteButton.click();

    // Step 5: Wait for the note creation modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify the selected text appears as the title
    const titleInput = page.locator('input#note-title');
    await expect(titleInput).toHaveValue('contentment');

    // Step 6: Add some content to the note
    const noteContent = page.locator('[role="dialog"] [contenteditable="true"]');
    await noteContent.fill('Contentment is a state of satisfaction and peace.');

    // Step 7: Save the note
    const saveButton = page.locator('button:has-text("Create Note")');
    await saveButton.click();

    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });

    // Step 8: Exit editing mode by clicking outside (click header which is outside editor)
    await page.locator('header').first().click();

    // Wait a bit for the view to update
    await page.waitForTimeout(500);

    // Step 9: Verify the hyperlink exists in read-only mode
    const linkInReadOnly = await page.evaluate(() => {
      const links = document.querySelectorAll('a[data-note-id]');
      return links.length > 0 && Array.from(links).some(link => link.textContent === 'contentment');
    });
    expect(linkInReadOnly).toBe(true);

    // Step 10: Click the hyperlink
    const linkElement = page.locator('a[data-note-id]:has-text("contentment")');
    await linkElement.click();

    // Step 11: Verify the note viewer opens
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify the note title is displayed (as a heading)
    const noteViewerTitle = page.locator('[role="dialog"] h2:has-text("contentment")');
    await expect(noteViewerTitle).toBeVisible();

    // Verify the note content is displayed
    const noteViewerContent = page.locator('[role="dialog"] >> text=Contentment is a state of satisfaction');
    await expect(noteViewerContent).toBeVisible();

    // Step 12: Close the note viewer (use the first Close button)
    const closeButton = page.locator('[role="dialog"] button:has-text("Close")').first();
    await closeButton.click();

    // Step 13: Click back into editing mode
    await todayEntry.click();
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Step 14: Verify the hyperlink is still visible and clickable in editing mode
    const linkInEditMode = page.locator('a[data-note-id]:has-text("contentment")');
    await expect(linkInEditMode).toBeVisible();

    // Click the link in editing mode
    await linkInEditMode.click();

    // Verify the note viewer opens again
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await expect(noteViewerTitle).toBeVisible();
  });

  test('should create multiple hyperlinks in the same entry', async ({ page }) => {
    // Step 1: Click on today's entry to start editing
    const todayEntry = page.locator('[data-entry-id*="2025"]').first();
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

    const makeNoteButton = page.locator('button:has-text("Make Note")');
    await expect(makeNoteButton).toBeVisible();
    await makeNoteButton.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Add content to the note
    const noteContent = page.locator('[role="dialog"] [contenteditable="true"]');
    await noteContent.fill('Mindfulness is the practice of being present in the moment.');

    const saveButton = page.locator('button:has-text("Create Note")');
    await saveButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

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

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Add content for gratitude note
    await noteContent.fill('Gratitude is the quality of being thankful and appreciative.');

    await saveButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Step 5: Exit editing mode (click header which is outside editor)
    await page.locator('header').first().click();

    // Wait a bit for the view to update
    await page.waitForTimeout(500);

    // Step 6: Verify both hyperlinks exist
    const linksExist = await page.evaluate(() => {
      const links = document.querySelectorAll('a[data-note-id]');
      const linkTexts = Array.from(links).map(link => link.textContent);
      return linkTexts.includes('mindfulness') && linkTexts.includes('gratitude');
    });
    expect(linksExist).toBe(true);

    // Step 7: Test both links work
    const mindfulnessLink = page.locator('a[data-note-id]:has-text("mindfulness")');
    await mindfulnessLink.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.locator('[role="dialog"] button:has-text("Close")').first().click();

    const gratitudeLink = page.locator('a[data-note-id]:has-text("gratitude")');
    await gratitudeLink.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.locator('[role="dialog"] button:has-text("Close")').first().click();
  });
});