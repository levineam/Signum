import { chromium } from 'playwright'

async function debugMakeNoteFlow() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3001')
    await page.waitForTimeout(1000)

    console.log('Opening note creation modal...')
    await page.click('[data-testid="make-note-button"]')

    console.log('Waiting for modal...')
    await page.waitForSelector('[role="dialog"]')

    console.log('Filling note title and content...')
    await page.fill('[data-testid="note-title-input"]', 'Debug Note Title')
    await page.fill('[data-testid="note-content-input"]', 'Debug note content for troubleshooting.')

    console.log('Saving note...')
    await page.click('[data-testid="save-note-button"]')

    await page.waitForTimeout(1000)
    console.log('Debug flow completed.')
  } catch (error) {
    console.error('Debug flow failed:', error)
  } finally {
    console.log('Keeping browser open for inspection. Press Ctrl+C to exit.')
    await new Promise(() => {})
  }
}

debugMakeNoteFlow()
