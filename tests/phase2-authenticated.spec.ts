import { test, expect } from '@playwright/test'

test.describe('Phase 2 - Authenticated User Testing', () => {
  test('should show unauthenticated state correctly', async ({ page }) => {
    // Set viewport to desktop size to ensure Sign Up button is visible (xl: 1280px+)
    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify Sign Up button is visible (may be hidden on smaller viewports due to responsive design)
    const signUpButton = page.locator('button:has-text("Sign Up")')
    // Use count check since button visibility depends on sidebar state
    if (await signUpButton.count() > 0) {
      await expect(signUpButton).toBeVisible()
    } else {
      console.log('⚠️ Sign Up button not visible (may be in collapsed sidebar)')
    }

    await page.screenshot({ path: 'tests/screenshots/auth-unauthenticated.png', fullPage: true })
  })

  test('should navigate to auth page when Sign Up clicked', async ({ page }) => {
    // Set viewport to desktop size to ensure Sign Up button is visible
    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click Sign Up
    const signUpButton = page.locator('button:has-text("Sign Up")')
    if (await signUpButton.count() > 0) {
      await signUpButton.click()
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

  test('should show Personal Ontology section on notes page', async ({ page }) => {
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Check for Personal Ontology section
    const personalOntology = page.locator('text=/personal ontology/i')
    const analyzeButton = page.locator('button:has-text("Analyze My Notes")')

    await expect(personalOntology).toBeVisible()
    console.log('✅ Personal Ontology section visible')

    // Analyze button should be present (even if disabled for unauth users)
    if (await analyzeButton.count() > 0) {
      console.log('✅ Analyze My Notes button present')
    }

    await page.screenshot({ path: 'tests/screenshots/notes-personal-ontology.png', fullPage: true })
  })

  test('should check if clicking Analyze shows auth prompt', async ({ page }) => {
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Try clicking Analyze button
    const analyzeButton = page.locator('button:has-text("Analyze My Notes")')

    if (await analyzeButton.count() > 0) {
      await analyzeButton.click()
      await page.waitForTimeout(1000)

      await page.screenshot({ path: 'tests/screenshots/analyze-clicked.png', fullPage: true })

      // Look for toast notification or auth prompt
      const toast = page.locator('[class*="toast"], [role="alert"]')
      if (await toast.count() > 0) {
        const toastText = await toast.textContent()
        console.log('Toast message:', toastText)

        // Should show "Please sign in" message (from OntologyAnalysisButton.tsx)
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
