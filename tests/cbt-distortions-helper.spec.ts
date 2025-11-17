import { test, expect } from '@playwright/test'

test.describe('CBT Distortions Helper', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to journal page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for journal entry to load (assumes authentication is already set up)
    await page.waitForSelector('[data-entry-id]', { timeout: 10000 })
  })

  test('expands and collapses helper panel', async ({ page }) => {
    // Verify helper is collapsed initially
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()

    // Click Explore button
    await page.locator('[data-testid="cbt-explore-button"]').click()

    // Verify panel expanded
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).toBeVisible()

    // Verify 10 distortions displayed
    const distortions = await page.locator('[data-testid^="distortion-"][data-testid$="-checkbox"]').count()
    expect(distortions).toBe(10)

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/cbt-helper-expanded.png', fullPage: true })
  })

  test('selects multiple distortions via checkboxes', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()

    // Select 3 distortions
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="distortion-overgeneralization-checkbox"]').check()
    await page.locator('[data-testid="distortion-mental-filter-checkbox"]').check()

    // Verify checkboxes are checked
    await expect(page.locator('[data-testid="distortion-all-or-nothing-checkbox"]')).toBeChecked()
    await expect(page.locator('[data-testid="distortion-overgeneralization-checkbox"]')).toBeChecked()
    await expect(page.locator('[data-testid="distortion-mental-filter-checkbox"]')).toBeChecked()

    // Verify Continue button is enabled
    await expect(page.locator('[data-testid="cbt-continue-button"]')).toBeEnabled()

    // Verify selection count badge shows "3"
    const badge = page.locator('[data-testid="cbt-continue-button"] span.bg-blue-500')
    await expect(badge).toHaveText('3')

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-multiple-selected.png', fullPage: true })
  })

  test('inserts selected distortions as plain paragraphs', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()

    // Select 2 distortions
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="distortion-emotional-reasoning-checkbox"]').check()

    // Click Continue
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for insertion
    await page.waitForTimeout(200)

    // Get journal entry content
    const content = await page.locator('[contenteditable]').first().innerHTML()

    // Verify plain paragraph format (not bullets or lists)
    expect(content).toContain('Today I experienced All-or-Nothing Thinking')
    expect(content).toContain('Today I experienced Emotional Reasoning')
    expect(content).toContain('Here\'s what happened:')

    // Verify no <ul>, <li>, or other list tags
    expect(content).not.toContain('<ul>')
    expect(content).not.toContain('<li>')

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-inserted.png', fullPage: true })
  })

  test('clears all selections when Clear button clicked', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()

    // Select 3 distortions
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="distortion-overgeneralization-checkbox"]').check()
    await page.locator('[data-testid="distortion-mental-filter-checkbox"]').check()

    // Verify Continue button is enabled
    await expect(page.locator('[data-testid="cbt-continue-button"]')).toBeEnabled()

    // Click Clear
    await page.locator('[data-testid="cbt-clear-button"]').click()

    // Verify all checkboxes unchecked
    const checkboxes = await page.locator('[data-testid^="distortion-"][data-testid$="-checkbox"]').all()
    for (const checkbox of checkboxes) {
      await expect(checkbox).not.toBeChecked()
    }

    // Verify Continue button is disabled
    await expect(page.locator('[data-testid="cbt-continue-button"]')).toBeDisabled()

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-cleared.png', fullPage: true })
  })

  test('collapses panel after successful insertion', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for collapse animation
    await page.waitForTimeout(300)

    // Verify panel is collapsed
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()

    // Verify Explore button is visible again
    await expect(page.locator('[data-testid="cbt-explore-button"]')).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-auto-collapsed.png', fullPage: true })
  })

  test('triggers auto-save after helper insertion', async ({ page }) => {
    // Get initial journal content
    const initialContent = await page.locator('[contenteditable]').first().innerHTML()

    await page.locator('[data-testid="cbt-explore-button"]').click()
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for 2-second debounce + buffer
    await page.waitForTimeout(2500)

    // Refresh page to verify persistence
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[contenteditable]')

    // Verify content persisted
    const content = await page.locator('[contenteditable]').first().innerHTML()
    expect(content).toContain('Today I experienced All-or-Nothing Thinking')
    expect(content).not.toBe(initialContent) // Content should have changed

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-persisted.png', fullPage: true })
  })

  test('supports keyboard navigation', async ({ page }) => {
    // Focus on Explore button using Tab navigation
    // Note: This test may need adjustment based on actual tab order
    const exploreButton = page.locator('[data-testid="cbt-explore-button"]')
    await exploreButton.focus()
    await page.keyboard.press('Enter')

    // Verify panel expanded
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).toBeVisible()

    // Tab to first checkbox and select with Space
    const firstCheckbox = page.locator('[data-testid="distortion-all-or-nothing-checkbox"]')
    await firstCheckbox.focus()
    await page.keyboard.press('Space')

    // Verify first checkbox selected
    await expect(firstCheckbox).toBeChecked()

    // Press Escape to collapse
    await page.keyboard.press('Escape')

    // Verify panel collapsed
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-keyboard-nav.png', fullPage: true })
  })

  test('returns focus to Explore button after collapse', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for collapse
    await page.waitForTimeout(300)

    // Verify focus on Explore button
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(focusedElement).toBe('cbt-explore-button')

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-focus-returned.png', fullPage: true })
  })

  test('announces insertion to screen readers', async ({ page }) => {
    await page.locator('[data-testid="cbt-explore-button"]').click()

    // Select 2 distortions
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="distortion-overgeneralization-checkbox"]').check()

    // Click Continue
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for announcement
    await page.waitForTimeout(100)

    // Verify aria-live region has exact text
    const announcement = await page.locator('[role="status"][aria-live="polite"]').textContent()
    expect(announcement).toBe('Inserted 2 distortion reflections')

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-aria-announcement.png', fullPage: true })
  })

  test('does not interfere with existing content', async ({ page }) => {
    // Type some test content first
    const editor = page.locator('[contenteditable]').first()
    await editor.click()
    await page.keyboard.type('This is my journal entry for today.')

    // Wait for typing to settle
    await page.waitForTimeout(300)

    // Get content after typing
    const contentAfterTyping = await editor.innerHTML()
    expect(contentAfterTyping).toContain('This is my journal entry for today.')

    // Now insert helper text
    await page.locator('[data-testid="cbt-explore-button"]').click()
    await page.locator('[data-testid="distortion-all-or-nothing-checkbox"]').check()
    await page.locator('[data-testid="cbt-continue-button"]').click()

    // Wait for insertion
    await page.waitForTimeout(200)

    // Verify both original content and helper text exist
    const finalContent = await editor.innerHTML()
    expect(finalContent).toContain('This is my journal entry for today.')
    expect(finalContent).toContain('Today I experienced All-or-Nothing Thinking')

    // Wait for auto-save
    await page.waitForTimeout(2500)

    // Refresh page to verify both persisted
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[contenteditable]')

    const persistedContent = await page.locator('[contenteditable]').first().innerHTML()
    expect(persistedContent).toContain('This is my journal entry for today.')
    expect(persistedContent).toContain('Today I experienced All-or-Nothing Thinking')

    await page.screenshot({ path: 'tests/screenshots/cbt-helper-no-interference.png', fullPage: true })
  })
})
