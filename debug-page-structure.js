const { chromium } = require('playwright');

async function debugPageStructure() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    console.log(`[CONSOLE ${timestamp}] ${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    console.log('Taking initial screenshot...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-page-structure.png', fullPage: true });

    console.log('Getting page title...');
    const title = await page.title();
    console.log('Page title:', title);

    console.log('Getting page HTML structure...');
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML (first 1000 chars):', bodyHTML.substring(0, 1000));

    console.log('Looking for any clickable elements...');
    const clickableElements = await page.locator('button, [role="button"], a, div[onclick], [tabindex]').all();
    console.log(`Found ${clickableElements.length} clickable elements`);

    for (let i = 0; i < Math.min(10, clickableElements.length); i++) {
      try {
        const text = await clickableElements[i].textContent();
        const tagName = await clickableElements[i].evaluate(el => el.tagName);
        const classes = await clickableElements[i].getAttribute('class');
        console.log(`Clickable ${i}: ${tagName} - "${text?.trim()}" - classes: ${classes}`);
      } catch (e) {
        console.log(`Clickable ${i}: Error getting info`);
      }
    }

    console.log('Looking for any text input elements...');
    const inputElements = await page.locator('input, textarea, [contenteditable="true"], [role="textbox"]').all();
    console.log(`Found ${inputElements.length} input elements`);

    for (let i = 0; i < inputElements.length; i++) {
      try {
        const tagName = await inputElements[i].evaluate(el => el.tagName);
        const type = await inputElements[i].getAttribute('type');
        const placeholder = await inputElements[i].getAttribute('placeholder');
        const classes = await inputElements[i].getAttribute('class');
        console.log(`Input ${i}: ${tagName} - type: ${type} - placeholder: "${placeholder}" - classes: ${classes}`);
      } catch (e) {
        console.log(`Input ${i}: Error getting info`);
      }
    }

    // Wait a bit to see any dynamic content loading
    console.log('Waiting 5 seconds for any dynamic content...');
    await page.waitForTimeout(5000);

    console.log('Taking final screenshot...');
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-final-structure.png', fullPage: true });

    // Open dev tools to see console
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-with-devtools.png', fullPage: true });

    console.log('\nBrowser will remain open for manual inspection. Check the screenshots and press Ctrl+C when done.');

    // Keep browser open for inspection
    await new Promise(() => {}); // Wait indefinitely

  } catch (error) {
    console.error('Debug failed:', error);
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-error.png', fullPage: true });
  }
}

debugPageStructure();