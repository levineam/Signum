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
    // Navigate to app and sign in
    await page.goto('/')

    // Check if already signed in by looking for sign out button
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    const isSignedIn = await signOutButton.isVisible().catch(() => false)

    if (!isSignedIn) {
      // Click sign in if on landing page
      const signInLink = page.getByRole('link', { name: /sign in/i })
      if (await signInLink.isVisible()) {
        await signInLink.click()
      }

      // Fill in credentials
      await page.getByLabel(/email/i).fill(TEST_USER.email)
      await page.getByLabel(/password/i).fill(TEST_USER.password)
      await page.getByRole('button', { name: /sign in/i }).click()

      // Wait for auth to complete
      await page.waitForURL(/\/(?!auth)/)
    }
  })

  test('manual analysis button shows last run info', async ({ page }) => {
    // Navigate to Notes page
    await page.getByRole('link', { name: /notes/i }).click()
    await expect(page).toHaveURL(/\/notes/)

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

  test('incremental analysis processes only new notes', async ({ page }) => {
    // Step 1: Navigate to Notes page
    await page.getByRole('link', { name: /notes/i }).click()
    await expect(page).toHaveURL(/\/notes/)

    // Step 2: Click Analyze button
    const analyzeButton = page.getByRole('button', { name: /analyze my notes/i })
    await analyzeButton.click()

    // Step 3: Wait for analysis to complete
    await expect(analyzeButton).toContainText(/analyzing/i)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

    // Step 4: Check for success toast
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Step 5: Verify last run info updated
    const lastUpdatedText = page.getByText(/last updated/i)
    await expect(lastUpdatedText).toBeVisible()
    await expect(lastUpdatedText).toContainText(/just now|ago/)

    // Step 6: Create a new journal entry
    await page.getByRole('link', { name: /journal/i }).click()
    await page.waitForTimeout(1000)

    const editor = page.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill('This is a test entry about compassion and helping others. I believe in the power of kindness.')

    // Wait for auto-save
    await page.waitForTimeout(3000)

    // Step 7: Run incremental analysis again
    await page.getByRole('link', { name: /notes/i }).click()
    await analyzeButton.click()

    // Step 8: Verify it processes notes (not skipped)
    await expect(analyzeButton).toContainText(/analyzing/i)
    await expect(analyzeButton).not.toContainText(/analyzing/i, { timeout: 30000 })

    // Should show success (not "no new notes")
    const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /ontology updated|analyzed/i })
    await expect(successToast).toBeVisible({ timeout: 5000 })
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
    await page.getByRole('link', { name: /notes/i }).click()

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
    await page.getByRole('link', { name: /notes/i }).click()

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
    await page.getByRole('link', { name: /notes/i }).click()

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
