import { chromium } from 'playwright'

async function runTest() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3001')
    await page.waitForTimeout(1000)

    const journalEntrySelector = '[data-testid="journal-entry-input"]'
    await page.waitForSelector(journalEntrySelector)
    await page.fill(journalEntrySelector, 'Testing note creation flow.')

    const makeNoteButton = '[data-testid="make-note-button"]'
    await page.click(makeNoteButton)

    const modalSelector = '[role="dialog"]'
    await page.waitForSelector(modalSelector)

    await page.fill('[data-testid="note-title-input"]', 'Test Note Title')
    await page.fill('[data-testid="note-content-input"]', 'Test note content for focused testing.')

    await page.click('[data-testid="save-note-button"]')

    await page.waitForSelector(modalSelector, { state: 'hidden' })

    console.log('Note creation flow completed successfully.')
  } catch (error) {
    console.error('Error during note focus test:', error)
  } finally {
    console.log('Keeping browser open for manual inspection.')
    await new Promise(() => {})
  }
}

runTest()
