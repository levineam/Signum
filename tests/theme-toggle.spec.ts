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
    // DIAGNOSTIC: Capture all console output from browser
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}]`, msg.text())
    })

    // DIAGNOSTIC: Capture page errors
    page.on('pageerror', error => {
      console.error('[Page Error]', error.message)
    })

    await page.goto('/')

    if (IS_E2E_TEST_MODE) {
      // Wait for initial page load
      await page.waitForLoadState('load')

      // DIAGNOSTIC: Check what's actually in the DOM
      const htmlSnapshot = await page.evaluate(() => {
        const headers = document.querySelectorAll('header')
        return {
          headerCount: headers.length,
          bodyHTML: document.body ? document.body.innerHTML.substring(0, 500) : 'NO BODY',
          hasMain: !!document.querySelector('main'),
          hasSidebar: !!document.querySelector('[class*="sidebar"]'),
        }
      })
      console.log('[TEST] DOM snapshot:', JSON.stringify(htmlSnapshot))

      // Wait for header element to exist with reasonable timeout
      const header = page.locator('header').first()
      await header.waitFor({ state: 'attached', timeout: 15000 })
      console.log('[TEST] Header element found in DOM')

      // Wait for auth to initialize
      await page.locator('header[data-auth-ready="true"]').waitFor({ state: 'attached', timeout: 15000 })
      console.log('[TEST] Auth ready!')
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
