/**
 * E2E Tests: Incremental Ontology Analysis
 * Story 2.4.4: Incremental AI Ontology Analysis
 */

import { test, expect } from '@playwright/test'
import { openJournalEditor } from './helpers/journal'

const TEST_USER = {
  email: 'dev-test-1@signum.dev',
  password: 'test1234'
}

const IS_E2E_MODE = ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '')
const ANALYZE_BUTTON = '[data-testid="ontology-analyze-button"]'

const IS_E2E_TEST_MODE = ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '')

test.describe('Incremental Ontology Analysis', () => {
  test.beforeEach(async ({ page }) => {
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
      // AuthProvider will auto-authenticate in test mode
      // Wait for ALL scripts to fully load before checking auth state
      await page.waitForLoadState('networkidle')
      await page.waitForLoadState('domcontentloaded')

      // DIAGNOSTIC: Check what data-auth-ready actually is before waiting
      const header = page.locator('header')
      const authReady = await header.getAttribute('data-auth-ready')
      const authLoading = await header.getAttribute('data-auth-loading')
      const renderTime = await header.getAttribute('data-render-timestamp')
      console.log('[TEST] Before wait - data-auth-ready:', authReady, 'data-auth-loading:', authLoading, 'render-timestamp:', renderTime)

      try {
        // Wait for auth to initialize by checking the data-auth-ready attribute
        await page.locator('header[data-auth-ready="true"]').waitFor({ state: 'attached', timeout: 15000 })
        console.log('[TEST] Auth ready!')
      } catch (error) {
        // DIAGNOSTIC: On timeout, show what the actual values are
        const finalAuthReady = await header.getAttribute('data-auth-ready')
        const finalAuthLoading = await header.getAttribute('data-auth-loading')
        console.error('[TEST] Timeout waiting for auth. Final state - data-auth-ready:', finalAuthReady, 'data-auth-loading:', finalAuthLoading)
        throw error
      }
      return
    }

    // Wait for auth to load first
    await page.waitForLoadState('networkidle')
    await page.locator('header[data-auth-ready="true"]').waitFor({ state: 'attached', timeout: 15000 })

    const signOutButton = page.getByRole('button', { name: /sign out/i })
    const isSignedIn = await signOutButton.isVisible().catch(() => false)

    if (isSignedIn) {
      return
    }

    await page.goto('/auth')
    await page.getByLabel(/email/i).waitFor({ state: 'visible' })
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(?!auth)/, { timeout: 30000 })
  })

  test('<CHORUS_TAG>smoke</CHORUS_TAG> @smoke manual analysis button shows last run info', async ({ page }) => {
    // Navigate directly to Ontology page
    await page.goto('/ontology')
    await expect(page).toHaveURL(/\/ontology/)

    // Find Analyze My Notes button
    const analyzeButton = page.locator(ANALYZE_BUTTON)
    await expect(analyzeButton).toBeVisible()

    // Check if last run info is displayed (if analysis has been run before)
    const lastUpdatedText = page.getByText(/last updated/i)

    // If last run info exists, verify format
    if (await lastUpdatedText.isVisible()) {
      await expect(lastUpdatedText).toContainText(/ago|just now/)
    }
  })

  test('<CHORUS_TAG>smoke</CHORUS_TAG> @smoke analysis button completes successfully', async ({ page }) => {
    // Navigate to Ontology page
    await page.goto('/ontology')
    await expect(page).toHaveURL(/\/ontology/)

    // Find and click Analyze button
    const analyzeButton = page.locator(ANALYZE_BUTTON)
    await analyzeButton.click()
    await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
    await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

    // Wait for analysis to complete - in mocked environment, this is instant
    // so we just verify the success indicators appear

    // Verify success toast appears (either "updated" or "no new notes")
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 10000 })

    // Verify last run info is updated (when backed by real data)
    const lastUpdatedText = page.getByText(/last updated/i)
    if (!IS_E2E_MODE) {
      await expect(lastUpdatedText).toBeVisible()
      await expect(lastUpdatedText).toContainText(/just now|ago/)
    }

    if (!IS_E2E_MODE) {
      await page.goto('/')
      const editor = await openJournalEditor(page)
      await editor.fill('This is a test entry about compassion and helping others. I believe in the power of kindness.')
      await page.waitForTimeout(3000)
      await page.goto('/ontology')
      await analyzeButton.click()
      await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
      await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

      const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /ontology updated|analyzed/i })
      await expect(successToast).toBeVisible({ timeout: 5000 })
    } else {
      // In E2E test mode the backend is mocked, so just trigger another run
      await analyzeButton.click()
      await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
      await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

      const toast = page.locator('[data-sonner-toast]').first()
      await expect(toast).toBeVisible({ timeout: 5000 })
      await expect(toast).toContainText(/ontology updated|analyzed|no new notes/i)
    }
  })

  test('feature flag check endpoint returns enabled status', async ({ page }) => {
    // Test GET endpoint for feature flag status
    const response = await page.request.get('/api/ontology/incremental-analysis')

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('enabled')
    expect(data).toHaveProperty('rateLimitMax')
    expect(data).toHaveProperty('rateLimitWindow')
  })

  test('analysis handles no new notes gracefully', async ({ page }) => {
    // Navigate to Notes page
    await page.goto('/ontology')

    // Run analysis twice in quick succession
    const analyzeButton = page.locator(ANALYZE_BUTTON)

    // First run
    await analyzeButton.click()
    await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
    await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

    // Wait a moment
    await page.waitForTimeout(1000)

    // Second run (should skip if no new notes)
    await analyzeButton.click()
    await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
    await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

    // Check for appropriate message
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Should either show "no new notes" or "ontology updated"
    await expect(toast).toContainText(/no new notes|ontology updated/i)
  })

  test('concurrent analysis is prevented', async ({ page }) => {
    // Navigate to Notes page
    await page.goto('/ontology')

    const analyzeButton = page.locator(ANALYZE_BUTTON)

    // Click analyze button
    await analyzeButton.click()
    await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
    await expect(analyzeButton).toBeEnabled({ timeout: 30000 })
  })

  test('analysis updates last run timestamp', async ({ page }) => {
    // Navigate to Notes page
    await page.goto('/ontology')

    // Record initial last updated text
    const lastUpdatedText = page.getByText(/last updated/i)
    let initialText = ''
    if (await lastUpdatedText.isVisible()) {
      initialText = await lastUpdatedText.textContent() || ''
    }

    // Run analysis
    const analyzeButton = page.locator(ANALYZE_BUTTON)
    await analyzeButton.click()
    await expect(analyzeButton).toBeDisabled({ timeout: 5000 })
    await expect(analyzeButton).toBeEnabled({ timeout: 30000 })

    // Wait for UI to update
    await page.waitForTimeout(1000)

    // Verify last updated changed
    await expect(lastUpdatedText).toBeVisible()
    const newText = await lastUpdatedText.textContent() || ''

    // Should now show "just now" or be different from initial
    if (initialText) {
      expect(newText).not.toBe(initialText)
    }
    await expect(lastUpdatedText).toContainText(/just now|ago/)
  })
})

test.describe('Incremental Analysis API', () => {
  test('returns 400 without userId', async ({ request }) => {
    const response = await request.post('/api/ontology/incremental-analysis', {
      data: {}
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('userId required')
  })

  test('returns feature flag status on GET', async ({ request }) => {
    const response = await request.get('/api/ontology/incremental-analysis')

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('enabled')
    expect(typeof data.enabled).toBe('boolean')
    expect(data).toHaveProperty('rateLimitMax')
    expect(typeof data.rateLimitMax).toBe('number')
  })
})
