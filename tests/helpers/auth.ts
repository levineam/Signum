import { Page } from '@playwright/test'
import { FORCE_TEST_USER_KEY } from '../../src/lib/e2eTestUtils'

async function setForcedTestUserFlag(page: Page, value: '1' | null) {
  await page.addInitScript(([forceKey, flag]) => {
    try {
      if (flag) {
        window.sessionStorage?.setItem(forceKey, flag)
      } else {
        window.sessionStorage?.removeItem(forceKey)
      }
    } catch (error) {
      console.warn('[loginAsTestUser] Unable to modify sessionStorage flag:', error)
    }
  }, [FORCE_TEST_USER_KEY, value])
}

export async function disableForcedTestUser(page: Page) {
  await setForcedTestUserFlag(page, null)
}

export async function clearForcedTestUser(page: Page) {
  await page.evaluate((forceKey) => {
    try {
      window.sessionStorage?.removeItem(forceKey)
    } catch (error) {
      console.warn('[loginAsTestUser] Unable to clear sessionStorage flag:', error)
    }
  }, FORCE_TEST_USER_KEY)
}

export async function loginAsTestUser(page: Page) {
  await setForcedTestUserFlag(page, '1')

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await Promise.race([
    page.getByRole('button', { name: /sign out/i }).waitFor({ timeout: 10000 }).catch(() => undefined),
    page.waitForSelector('[data-entry-id]', { timeout: 10000 }).catch(() => undefined)
  ])

  const flagValue = await page.evaluate((forceKey) => {
    try {
      return window.sessionStorage?.getItem(forceKey)
    } catch {
      return null
    }
  }, FORCE_TEST_USER_KEY)
  console.log('[loginAsTestUser] Force flag value:', flagValue)
}
