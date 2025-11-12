import type { Locator, Page } from '@playwright/test'
import { JOURNAL_EDITOR_SELECTOR } from './selectors'

async function getDefaultEntry(page: Page): Promise<Locator> {
  const entries = page.locator('[data-entry-id]')
  if (await entries.count() === 0) {
    await page.waitForSelector('[data-entry-id]', { timeout: 10000 })
  }
  return entries.first()
}

export async function openJournalEditor(page: Page, entry?: Locator): Promise<Locator> {
  const entryCard = entry ?? await getDefaultEntry(page)

  await entryCard.scrollIntoViewIfNeeded().catch(() => undefined)
  await page.waitForTimeout(100)

  const clickableArea = entryCard.locator('.cursor-text').first()
  const clickTarget = (await clickableArea.count()) > 0 ? clickableArea : entryCard
  await clickTarget.click()

  const scopedEditor = entryCard.locator(JOURNAL_EDITOR_SELECTOR).first()
  if (await scopedEditor.count() > 0) {
    await scopedEditor.waitFor({ state: 'visible', timeout: 10000 })
    return scopedEditor
  }

  const pageEditor = page.locator(JOURNAL_EDITOR_SELECTOR).first()
  await pageEditor.waitFor({ state: 'visible', timeout: 10000 })
  return pageEditor
}
