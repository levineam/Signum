const { chromium } = require('playwright');

async function testMakeNoteButton() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    consoleLogs.push(`[${timestamp}] ${msg.type()}: ${msg.text()}`);
    console.log(`[${timestamp}] ${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('1. Navigating to journal application...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    console.log('2. Looking for today\'s journal entry...');
    // Wait for the page to load and find the first journal entry
    await page.waitForSelector('[data-testid="journal-entry"], .journal-entry, [class*="entry"]', { timeout: 10000 });

    // Take initial screenshot
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-initial.png', fullPage: true });

    console.log('3. Clicking on today\'s journal entry...');
    // Try different selectors for the journal entry
    const entrySelectors = [
      '[data-testid="journal-entry"]:first-child',
      '.journal-entry:first-child',
      '[class*="entry"]:first-child',
      'div:has-text("Today"):first',
      'div[role="button"]:first-child'
    ];

    let entryClicked = false;
    for (const selector of entrySelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          entryClicked = true;
          console.log(`Successfully clicked entry with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    if (!entryClicked) {
      // Try clicking the first clickable element that might be a journal entry
      await page.click('body');
      await page.waitForTimeout(1000);
      const clickableElements = await page.locator('div, button, [role="button"]').all();
      for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
        try {
          await clickableElements[i].click();
          console.log(`Clicked element ${i}`);
          await page.waitForTimeout(500);
          break;
        } catch (e) {
          console.log(`Element ${i} not clickable`);
        }
      }
    }

    await page.waitForTimeout(2000);

    console.log('4. Looking for text editor...');
    // Wait for editor to appear
    const editorSelectors = [
      '[contenteditable="true"]',
      '.editor',
      '[data-testid="editor"]',
      'textarea',
      '[role="textbox"]'
    ];

    let editor = null;
    for (const selector of editorSelectors) {
      try {
        editor = page.locator(selector).first();
        if (await editor.isVisible()) {
          console.log(`Found editor with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Editor selector ${selector} not found`);
      }
    }

    if (!editor || !(await editor.isVisible())) {
      console.log('No editor found, taking screenshot...');
      await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-no-editor.png', fullPage: true });
      throw new Error('Editor not found');
    }

    console.log('5. Typing text in editor...');
    await editor.click();
    await page.waitForTimeout(500);
    const testText = 'This is test text for the Make Note button functionality.';
    await editor.fill(testText);
    await page.waitForTimeout(1000);

    console.log('6. Selecting the text...');
    // Select all the text we just typed
    await editor.click();
    await page.keyboard.press('Control+a'); // Select all text
    await page.waitForTimeout(1000);

    console.log('7. Taking screenshot with console open...');
    // Open developer tools to see console
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);

    // Take screenshot showing both interface and console
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-with-console.png', fullPage: true });

    console.log('8. Looking for Make Note button...');
    // Check for Make Note button
    const makeNoteSelectors = [
      '[data-testid="make-note-button"]',
      'button:has-text("Make Note")',
      '[title="Make Note"]',
      '.make-note-button',
      'button[aria-label*="Note"]'
    ];

    let makeNoteButton = null;
    for (const selector of makeNoteSelectors) {
      try {
        makeNoteButton = page.locator(selector);
        if (await makeNoteButton.isVisible()) {
          console.log(`Found Make Note button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Make Note button selector ${selector} not found`);
      }
    }

    if (makeNoteButton && await makeNoteButton.isVisible()) {
      console.log('✅ Make Note button is visible!');
      await makeNoteButton.click();
      console.log('✅ Clicked Make Note button');
    } else {
      console.log('❌ Make Note button not found or not visible');
    }

    console.log('9. Waiting for any additional logs...');
    await page.waitForTimeout(3000);

    console.log('10. Final screenshot...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-final.png', fullPage: true });

    console.log('\n=== CONSOLE LOGS SUMMARY ===');
    consoleLogs.forEach(log => console.log(log));

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for manual inspection. Press Ctrl+C to close.');
    // Don't close the browser automatically
    // await browser.close();
  }
}

testMakeNoteButton();