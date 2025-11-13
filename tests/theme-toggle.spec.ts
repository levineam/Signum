import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const TOGGLE_ROLE = { name: /toggle theme/i }
const THEME_STORAGE_KEY = 'signum-theme'
const IS_E2E_TEST_MODE = ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '')

async function isDarkTheme(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'))
}

test.describe('Theme toggle', () => {
test('<CHORUS_TAG>smoke</CHORUS_TAG> @smoke toggles theme and persists choice across reloads', async ({ page }) => {
    await page.goto('/')

    if (IS_E2E_TEST_MODE) {
      // Wait for auth to initialize and page to fully load
      await page.waitForLoadState('networkidle')
      await page.waitForLoadState('domcontentloaded')
      await page.getByRole('button', { name: /sign out/i }).waitFor({ state: 'visible', timeout: 10000 })
    }

    const toggle = page.getByRole('switch', TOGGLE_ROLE)
    await expect(toggle).toBeVisible()

    const initialState = await toggle.getAttribute('aria-checked')
    expect(initialState).not.toBeNull()

    await toggle.click()

    const toggledState = await toggle.getAttribute('aria-checked')
    expect(toggledState).not.toBeNull()

    const expectDark = toggledState === 'true'

    await expect.poll(async () => isDarkTheme(page)).toBe(expectDark)

    const storedTheme = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)
    expect(storedTheme).toBe(expectDark ? 'dark' : 'light')

    await page.reload()

    await expect.poll(async () => isDarkTheme(page)).toBe(expectDark)

    const reloadedStoredTheme = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)
    expect(reloadedStoredTheme).toBe(expectDark ? 'dark' : 'light')
  })

  test('toggle is available on notes page', async ({ page }) => {
    await page.goto('/notes')
    const toggle = page.getByRole('switch', TOGGLE_ROLE)
    await expect(toggle).toBeVisible()
  })
})
