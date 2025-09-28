const { chromium } = require('playwright');

async function testMakeNoteButton() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs with detailed formatting
  const consoleLogs = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`;
    consoleLogs.push(logMessage);
    console.log(logMessage);
  });

  try {
    console.log('🚀 Step 1: Navigating to journal application...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    console.log('📷 Taking initial screenshot...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step1-initial.png', fullPage: true });

    console.log('🎯 Step 2: Clicking on Today\'s journal entry...');
    // Look for the "Today" entry - it should contain "Click here to start today's entry"
    const todayEntry = page.locator('text=Click here to start today\'s entry').first();
    await todayEntry.waitFor({ state: 'visible', timeout: 10000 });
    await todayEntry.click();

    console.log('⏳ Waiting for editor to appear...');
    await page.waitForTimeout(2000);

    console.log('📷 Taking screenshot after clicking Today entry...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step2-after-click.png', fullPage: true });

    console.log('📝 Step 3: Finding and typing in the editor...');
    // Look for contenteditable editor
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    console.log('✍️ Typing test text...');
    const testText = 'This is test text for the Make Note button functionality. Let me select this text to see if the Make Note button appears.';
    await editor.click();
    await page.waitForTimeout(500);
    await editor.fill(testText);
    await page.waitForTimeout(1000);

    console.log('📷 Taking screenshot after typing...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step3-after-typing.png', fullPage: true });

    console.log('🖱️ Step 4: Selecting the text...');
    // Select all the text we just typed
    await editor.click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+a'); // Select all text
    await page.waitForTimeout(2000); // Give time for selection events to fire

    console.log('📷 Taking screenshot after text selection...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step4-after-selection.png', fullPage: true });

    console.log('🔍 Step 5: Opening developer tools to see console...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);

    console.log('📷 Taking screenshot with dev tools open...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step5-with-devtools.png', fullPage: true });

    console.log('🔎 Step 6: Looking for Make Note button...');
    // Check for various possible selectors for the Make Note button
    const makeNoteSelectors = [
      '[data-testid="make-note-button"]',
      'button:has-text("Make Note")',
      '[title="Make Note"]',
      '.make-note-button',
      'button[aria-label*="Note"]',
      'button[aria-label*="note"]',
      '[data-tooltip="Make Note"]',
      'button:has-text("Note")',
      '.toolbar button', // Generic toolbar buttons
    ];

    let makeNoteFound = false;
    for (const selector of makeNoteSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`✅ Found ${count} element(s) with selector: ${selector}`);
          for (let i = 0; i < count; i++) {
            const text = await element.nth(i).textContent();
            const isVisible = await element.nth(i).isVisible();
            console.log(`   Element ${i}: "${text}" - Visible: ${isVisible}`);
          }

          const visibleElement = element.first();
          if (await visibleElement.isVisible()) {
            makeNoteFound = true;
            console.log(`🎯 Make Note button found and visible with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        console.log(`❌ Selector ${selector} not found or error: ${e.message}`);
      }
    }

    if (!makeNoteFound) {
      console.log('🔍 No Make Note button found. Let\'s check all toolbar buttons...');
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} total buttons on the page:`);

      for (let i = 0; i < Math.min(20, allButtons.length); i++) {
        try {
          const text = await allButtons[i].textContent();
          const isVisible = await allButtons[i].isVisible();
          const className = await allButtons[i].getAttribute('class');
          const ariaLabel = await allButtons[i].getAttribute('aria-label');
          const title = await allButtons[i].getAttribute('title');

          console.log(`Button ${i}: "${text?.trim()}" - Visible: ${isVisible}`);
          if (className) console.log(`   Class: ${className}`);
          if (ariaLabel) console.log(`   Aria-label: ${ariaLabel}`);
          if (title) console.log(`   Title: ${title}`);
        } catch (e) {
          console.log(`Button ${i}: Error getting info - ${e.message}`);
        }
      }
    }

    console.log('⏳ Step 7: Waiting for additional console logs...');
    await page.waitForTimeout(3000);

    console.log('📷 Taking final screenshot...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-step7-final.png', fullPage: true });

    console.log('\n=== 📋 CONSOLE LOGS SUMMARY ===');
    if (consoleLogs.length === 0) {
      console.log('❌ No console logs captured from the page');
    } else {
      consoleLogs.forEach(log => console.log(log));
    }

    console.log('\n=== 📊 TEST RESULTS ===');
    console.log(`✅ Successfully navigated to journal application`);
    console.log(`✅ Successfully clicked on Today's entry`);
    console.log(`✅ Successfully found and typed in editor`);
    console.log(`✅ Successfully selected text`);
    console.log(`${makeNoteFound ? '✅' : '❌'} Make Note button ${makeNoteFound ? 'found' : 'not found'}`);

    console.log('\n🔍 Browser will remain open for manual inspection. Press Ctrl+C when done.');
    // Keep browser open for inspection
    await new Promise(() => {}); // Wait indefinitely

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-error.png', fullPage: true });

    console.log('\n=== 📋 CONSOLE LOGS (Error Case) ===');
    consoleLogs.forEach(log => console.log(log));
  }
}

testMakeNoteButton();