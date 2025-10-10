import { chromium } from 'playwright'

async function debugPageStructure() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    const timestamp = new Date().toISOString()
    console.log(`[CONSOLE ${timestamp}] ${msg.type()}: ${msg.text()}`)
  })

  try {
    console.log('Navigating to http://localhost:3001...')
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    console.log('Taking initial screenshot...')
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-page-structure.png', fullPage: true })

    console.log('Getting page title...')
    const title = await page.title()
    console.log('Page title:', title)

    console.log('Getting page HTML structure...')
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('Body HTML (first 1000 chars):', bodyHTML.substring(0, 1000))

    console.log('Looking for any clickable elements...')
    const clickableElements = await page.locator('button, [role="button"], a, div[onclick], [tabindex]').all()
    console.log(`Found ${clickableElements.length} clickable elements`)

    for (let i = 0; i < Math.min(10, clickableElements.length); i += 1) {
      try {
        const element = clickableElements[i]
        const text = await element.textContent()
        const tagName = await element.evaluate((el) => el.tagName)
        const classes = await element.getAttribute('class')
        console.log(`Clickable ${i}: ${tagName} - "${text?.trim()}" - classes: ${classes}`)
      } catch (infoError) {
        console.log(`Clickable ${i}: Error getting info`, infoError)
      }
    }

    console.log('Looking for any text input elements...')
    const inputElements = await page.locator('input, textarea, [contenteditable="true"], [role="textbox"]').all()
    console.log(`Found ${inputElements.length} input elements`)

    for (let i = 0; i < inputElements.length; i += 1) {
      try {
        const element = inputElements[i]
        const tagName = await element.evaluate((el) => el.tagName)
        const type = await element.getAttribute('type')
        const placeholder = await element.getAttribute('placeholder')
        const classes = await element.getAttribute('class')
        console.log(`Input ${i}: ${tagName} - type: ${type} - placeholder: "${placeholder}" - classes: ${classes}`)
      } catch (inputError) {
        console.log(`Input ${i}: Error getting info`, inputError)
      }
    }

    console.log('Waiting 5 seconds for any dynamic content...')
    await page.waitForTimeout(5000)

    console.log('Taking final screenshot...')
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-final-structure.png', fullPage: true })

    await page.keyboard.press('F12')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-with-devtools.png', fullPage: true })

    console.log('\nBrowser will remain open for manual inspection. Press Ctrl+C when done.')

    await new Promise(() => {})
  } catch (error) {
    console.error('Debug failed:', error)
    await page.screenshot({ path: '/Users/andrewleveiss/Signum/signum-app/debug-error.png', fullPage: true })
  }
}

debugPageStructure()
