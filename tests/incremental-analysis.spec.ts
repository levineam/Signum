/**
 * E2E Tests: Incremental Ontology Analysis
 * Story 2.4.4: Incremental AI Ontology Analysis
 */

import { test, expect } from '@playwright/test'

const TEST_USER = {
  email: 'dev-test-1@signum.dev',
  password: 'test1234'
}

test.describe('Incremental Ontology Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app root
    await page.goto('/')

    // Check if already signed in by looking for sign out button
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    const isSignedIn = await signOutButton.isVisible().catch(() => false)

    if (!isSignedIn) {
      // Go directly to auth page for a reliable sign-in form
      await page.goto('/auth')

      // Ensure the auth form is rendered before interacting
      await page.getByLabel(/email/i).waitFor({ state: 'visible' })

      // Fill in credentials
      await page.getByLabel(/email/i).fill(TEST_USER.email)
      await page.getByLabel(/password/i).fill(TEST_USER.password)
      await page.getByRole('button', { name: /sign in/i }).click()

      // Wait for auth to complete and redirect away from /auth
      await page.waitForURL(/\/(?!auth)/, { timeout: 30000 })
    }
  })

  test('<CHORUS_TAG>smoke</CHORUS_TAG> @smoke manual analysis button shows last run info', async ({ page }) => {
    // Navigate directly to Ontology page
    await page.goto('/ontology')
    await expect(page).toHaveURL(/\/ontology/)

    // Find Analyze My Notes button
    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })
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
    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })
    await analyzeButton.click()

    // Verify button shows "Analyzing..." state during execution
    await expect(analyzeButton).toContainText(/analyzing/i, { timeout: 5000 })

    // Wait for analysis to complete (button text changes back)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

    // Verify success toast appears
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Verify last run info is updated
    const lastUpdatedText = page.getByText(/last updated/i)
    await expect(lastUpdatedText).toBeVisible()
    await expect(lastUpdatedText).toContainText(/just now|ago/)
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
    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })

    // First run
    await analyzeButton.click()
    await expect(analyzeButton).toContainText(/analyzing/i)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

    // Wait a moment
    await page.waitForTimeout(1000)

    // Second run (should skip if no new notes)
    await analyzeButton.click()
    await expect(analyzeButton).toContainText(/analyzing/i)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

    // Check for appropriate message
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Should either show "no new notes" or "ontology updated"
    await expect(toast).toContainText(/no new notes|ontology updated/i)
  })

  test('concurrent analysis is prevented', async ({ page }) => {
    // Navigate to Notes page
    await page.goto('/ontology')

    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })

    // Click analyze button
    await analyzeButton.click()
    await expect(analyzeButton).toContainText(/analyzing/i)

    // Button should be disabled during analysis
    await expect(analyzeButton).toBeDisabled()

    // Wait for completion
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })
    await expect(analyzeButton).toBeEnabled()
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
    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })
    await analyzeButton.click()
    await expect(analyzeButton).toContainText(/analyzing/i)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

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
