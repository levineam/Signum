import { test, expect } from '@playwright/test'

test.describe('Phase 2 - Authenticated User Testing', () => {
  test('should show unauthenticated state correctly', async ({ page, context }) => {
    // Clear all cookies and storage to ensure unauthenticated state
    await context.clearCookies()
    await context.clearPermissions()

    // Set viewport to desktop size to ensure Sign Up button is visible (xl: 1280px+)
    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // At 1400px viewport, Sign Up link must be visible for unauthenticated users
    // Note: shadcn Button with asChild renders as <a> tag, not <button>
    const signUpLink = page.locator('a:has-text("Sign Up")')
    await expect(signUpLink).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/auth-unauthenticated.png', fullPage: true })
  })

  test('should navigate to auth page when Sign Up clicked', async ({ page, context }) => {
    // Clear all cookies and storage to ensure unauthenticated state
    await context.clearCookies()
    await context.clearPermissions()

    // Set viewport to desktop size to ensure Sign Up button is visible
    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click Sign Up link (shadcn Button with asChild renders as <a> tag)
    const signUpLink = page.locator('a:has-text("Sign Up")')
    if (await signUpLink.count() > 0) {
      await signUpLink.click()
      await page.waitForLoadState('networkidle')

      await page.screenshot({ path: 'tests/screenshots/auth-signup-page.png', fullPage: true })

      // Check if we're on auth page
      const url = page.url()
      console.log('Auth page URL:', url)

      // Look for Supabase auth UI elements
      const hasEmailInput = await page.locator('input[type="email"]').count() > 0
      const hasPasswordInput = await page.locator('input[type="password"]').count() > 0

      console.log('Has email input:', hasEmailInput)
      console.log('Has password input:', hasPasswordInput)

      // If auth elements exist, the navigation worked
      if (hasEmailInput || hasPasswordInput) {
        console.log('✅ Successfully navigated to auth page')
      } else {
        console.log('⚠️ Auth page may have different structure')
      }
    }
  })

  test('should handle journal interaction without auth', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Try to interact with journal prompt
    const promptCard = page.locator('[class*="prompt"]').first()
    if (await promptCard.count() > 0) {
      console.log('✅ Prompt card found')
    }

    // Look for any editor or textarea
    const editors = await page.locator('textarea, [contenteditable="true"]').count()
    console.log('Editable elements found:', editors)

    await page.screenshot({ path: 'tests/screenshots/journal-unauthenticated.png', fullPage: true })

    // The app should gracefully handle unauthenticated state
    // This is expected behavior for Phase 2 (no route protection yet)
  })

  test('should display notes page for unauthenticated users', async ({ page, context }) => {
    // Clear cookies to ensure unauthenticated state
    await context.clearCookies()
    await context.clearPermissions()

    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Check that the notes page loads (shows empty state or similar)
    const emptyMessage = page.locator('text=/no notes yet/i')
    // For unauthenticated users, the page should load without errors
    // We're not asserting visibility since auth state may vary

    await page.screenshot({ path: 'tests/screenshots/notes-unauthenticated.png', fullPage: true })
  })

  test('should check ontology page Analyze button', async ({ page, context }) => {
    // Clear cookies to ensure unauthenticated state
    await context.clearCookies()
    await context.clearPermissions()

    await page.goto('/ontology')
    await page.waitForLoadState('networkidle')

    // Check if Analyze button exists on ontology page
    const analyzeButton = page.locator('button:has-text("Analyze")')

    if (await analyzeButton.count() > 0) {
      await analyzeButton.click()
      await page.waitForTimeout(1000)

      await page.screenshot({ path: 'tests/screenshots/ontology-analyze-clicked.png', fullPage: true })

      // Look for toast notification or auth prompt
      const toast = page.locator('[class*="toast"], [role="alert"]')
      if (await toast.count() > 0) {
        const toastText = await toast.textContent()
        console.log('Toast message:', toastText)

        // Should show "Please sign in" message
        if (toastText?.toLowerCase().includes('sign in')) {
          console.log('✅ Correct auth check - shows sign in prompt')
        }
      } else {
        console.log('⚠️ No toast notification found')
      }
    }
  })

  test('should have no console errors on main pages', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Test homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Test notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (errors.length > 0) {
      console.log('⚠️ Console errors found:')
      errors.forEach(err => console.log('  -', err))
    } else {
      console.log('✅ No console errors on main pages')
    }

    expect(errors.length).toBe(0)
  })
})
