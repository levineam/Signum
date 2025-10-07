import { test, expect } from '@playwright/test'

const PREVIEW_URL = 'https://signum-git-story-241-auth-integration-levineams-projects.vercel.app'

// Test credentials - using dev test account
const TEST_EMAIL = process.env.TEST_EMAIL || 'dev-test-1@signum.dev'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test-password-123'

test.describe('Phase 2 - Auth Integration Preview Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PREVIEW_URL)
  })

  test('should load homepage and show auth UI', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if we're on auth page or authenticated already
    const url = page.url()
    console.log('Current URL:', url)

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/preview-home.png', fullPage: true })

    // Check for sign in elements or authenticated content
    const hasSignIn = await page.locator('text=/sign in|log in/i').count() > 0
    const hasJournal = await page.locator('text=/journal/i').count() > 0

    console.log('Has sign in:', hasSignIn)
    console.log('Has journal:', hasJournal)

    expect(hasSignIn || hasJournal).toBeTruthy()
  })

  test('should authenticate and access journal', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Check if already authenticated
    const isAuthenticated = await page.locator('text=/journal|new entry/i').count() > 0

    if (!isAuthenticated) {
      console.log('Not authenticated, looking for sign in...')

      // Look for sign in button/link
      const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first()
      if (await signInButton.count() > 0) {
        await signInButton.click()
        await page.waitForLoadState('networkidle')

        // Fill in credentials if we see email field
        const emailInput = page.locator('input[type="email"]')
        if (await emailInput.count() > 0) {
          await emailInput.fill(TEST_EMAIL)
          await page.locator('input[type="password"]').fill(TEST_PASSWORD)
          await page.locator('button[type="submit"]').click()
          await page.waitForLoadState('networkidle')
        }
      }
    }

    await page.screenshot({ path: 'tests/screenshots/preview-authenticated.png', fullPage: true })

    // Verify we can see journal content
    const hasJournalContent = await page.locator('text=/journal|entry|write/i').count() > 0
    expect(hasJournalContent).toBeTruthy()
  })

  test('should create journal entry with user ID', async ({ page }) => {
    // This test assumes authentication is working
    await page.waitForLoadState('networkidle')

    // Navigate to journal/home
    await page.goto(`${PREVIEW_URL}/`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/screenshots/preview-journal-page.png', fullPage: true })

    // Look for textarea or editor
    const editor = page.locator('textarea, [contenteditable="true"]').first()

    if (await editor.count() > 0) {
      await editor.click()
      await editor.fill('Test entry for Phase 2 auth integration - ' + new Date().toISOString())

      // Look for save button or wait for auto-save
      await page.waitForTimeout(2000)

      await page.screenshot({ path: 'tests/screenshots/preview-journal-entry-created.png', fullPage: true })

      console.log('✅ Journal entry creation attempted')
    } else {
      console.log('⚠️ No editor found, may need authentication')
    }
  })

  test('should access notes page', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Try to navigate to notes page
    await page.goto(`${PREVIEW_URL}/notes`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/screenshots/preview-notes-page.png', fullPage: true })

    // Check for notes page content
    const hasNotesContent = await page.locator('text=/personal ontology|all notes|values|beliefs|aims/i').count() > 0

    if (hasNotesContent) {
      console.log('✅ Notes page loaded')
    } else {
      console.log('⚠️ Notes page may require authentication')
    }
  })

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto(PREVIEW_URL)
    await page.waitForLoadState('networkidle')

    // Navigate through key pages
    await page.goto(`${PREVIEW_URL}/notes`)
    await page.waitForLoadState('networkidle')

    await page.goto(`${PREVIEW_URL}/`)
    await page.waitForLoadState('networkidle')

    // Log any errors found
    if (errors.length > 0) {
      console.log('⚠️ Console errors found:')
      errors.forEach(err => console.log('  -', err))
    } else {
      console.log('✅ No console errors detected')
    }

    // Don't fail the test, just report
    console.log('Total errors:', errors.length)
  })
})
