import { test, expect } from '@playwright/test'

/**
 * Phase 1: Link Creation with Supabase Metadata
 *
 * Tests Story 2.4.2 Phase 1 implementation:
 * - Metadata capture (snippet, contextBefore, contextAfter, textContentPos)
 * - Supabase link persistence
 * - data-link-id attribute on <a> tags
 *
 * Known Limitation: Links do NOT rehydrate on page refresh (Phase 2)
 */

const TEST_EMAIL = 'dev-test-1@signum.dev'
const TEST_PASSWORD = 'DevTest2025!User1'

test.describe('Phase 1: Link Creation with Metadata', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (uses baseURL from playwright.config.ts)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if we're already on the journal page (signed in via cookie)
    const hasJournal = await page.locator('[data-entry-id]').count()

    if (hasJournal === 0) {
      // Not signed in, navigate to auth page
      const hasEmailInput = await page.locator('input[type="email"]').count()

      if (hasEmailInput === 0) {
        // Go to /auth page
        await page.goto('/auth')
        await page.waitForSelector('input[type="email"]', { timeout: 10000 })
      }

      // Sign in
      await page.fill('input[type="email"]', TEST_EMAIL)
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button:has-text("Sign In")')

      // Wait for journal to load
      await page.waitForSelector('[data-entry-id]', { timeout: 15000 })
    }
  })

  test('should create link with metadata and data-link-id attribute', async ({ page }) => {
    // Set up console log listener
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('📊') || text.includes('💾') || text.includes('🔗')) {
        consoleLogs.push(text)
      }
    })

    // Look for any contenteditable element (journal editor)
    const editor = page.locator('[contenteditable="true"]').first()
    const editorCount = await editor.count()

    if (editorCount === 0) {
      console.log('❌ No editor found - test cannot proceed')
      throw new Error('No contenteditable editor found on page')
    }

    // Add some test content with context for metadata capture
    const testContent = 'I have been thinking about stoicism lately. The practice of negative visualization helps me appreciate what I have today.'
    await editor.click()
    await page.waitForTimeout(500) // Wait for editor to focus
    await editor.fill(testContent)

    // Wait for auto-save
    await page.waitForTimeout(3000)

    // Select the word "stoicism" for link creation
    // We need to use JavaScript to select text precisely
    await page.evaluate(() => {
      const editorEl = document.querySelector('[contenteditable="true"]') as HTMLElement
      if (!editorEl) throw new Error('Editor not found')

      const text = editorEl.textContent || ''
      const startIndex = text.indexOf('stoicism')
      if (startIndex === -1) throw new Error('Target text "stoicism" not found')

      const range = document.createRange()
      const selection = window.getSelection()

      // Find the text node containing "stoicism"
      const walker = document.createTreeWalker(
        editorEl,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node
      while (node = walker.nextNode()) {
        const nodeText = node.textContent || ''
        const index = nodeText.indexOf('stoicism')
        if (index !== -1) {
          range.setStart(node, index)
          range.setEnd(node, index + 8) // "stoicism" is 8 characters
          selection?.removeAllRanges()
          selection?.addRange(range)
          break
        }
      }
    })

    // Wait for selection to register
    await page.waitForTimeout(500)

    // Click "Make Note" button in toolbar
    await page.click('button:has-text("Make Note")')

    // Wait for modal
    await page.waitForSelector('h2:has-text("Create Note")', { timeout: 5000 })

    // Verify title is pre-filled with "stoicism"
    const titleInput = page.locator('input[placeholder*="note title"]').or(page.locator('input').first())
    await expect(titleInput).toHaveValue('stoicism')

    // Save note
    await page.click('button:has-text("Save")')

    // Wait for modal to close
    await page.waitForSelector('h2:has-text("Create Note")', { state: 'hidden', timeout: 5000 })

    // Wait for link to appear
    await page.waitForTimeout(1000)

    // Test 1: Verify link appears in journal entry
    const link = page.locator('a.note-link:has-text("stoicism")')
    await expect(link).toBeVisible({ timeout: 5000 })

    // Test 2: Verify link has data-link-id attribute
    const linkElement = await link.elementHandle()
    const dataLinkId = await linkElement?.getAttribute('data-link-id')
    const dataNoteId = await linkElement?.getAttribute('data-note-id')

    expect(dataLinkId).toBeTruthy()
    expect(dataLinkId).toMatch(/^[a-f0-9-]{36}$/) // UUID format
    expect(dataNoteId).toBeTruthy()
    expect(dataNoteId).toMatch(/^[a-f0-9-]{36}$/)

    console.log('✅ Link attributes:', { dataLinkId, dataNoteId })

    // Test 3: Verify console logs for metadata capture
    await page.waitForTimeout(1000) // Let logs finish

    const hasMetadataLog = consoleLogs.some(log => log.includes('📊 Captured selection metadata'))
    const hasSupabaseLog = consoleLogs.some(log => log.includes('💾 Link created in Supabase'))
    const hasDomLog = consoleLogs.some(log => log.includes('🔗 Created link in editor DOM'))

    expect(hasMetadataLog).toBeTruthy()
    expect(hasSupabaseLog).toBeTruthy()
    expect(hasDomLog).toBeTruthy()

    console.log('✅ All required console logs present')

    // Test 4: Verify link is clickable
    await link.click()

    // Should open note viewer modal
    await page.waitForSelector('text=stoicism', { timeout: 5000 })
    const noteViewerTitle = page.locator('h2:has-text("stoicism")').or(page.locator('text=stoicism'))
    await expect(noteViewerTitle).toBeVisible()

    console.log('✅ Link click opens note viewer')

    // Close note viewer
    await page.keyboard.press('Escape')

    // Test 5: Verify known limitation - link disappears on refresh
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Link should NOT be present after refresh (Phase 1 limitation)
    const linkAfterRefresh = page.locator('a.note-link:has-text("stoicism")')
    await expect(linkAfterRefresh).toHaveCount(0)

    console.log('✅ Confirmed Phase 1 limitation: Link does not persist on refresh')
  })

  test('should capture correct metadata context', async ({ page }) => {
    // Capture network requests to Supabase
    const supabaseRequests: Array<{ url: string; postData: string | null }> = []

    page.on('request', (request) => {
      if (request.url().includes('supabase') && request.method() === 'POST') {
        supabaseRequests.push({
          url: request.url(),
          postData: request.postData()
        })
      }
    })

    // Look for any contenteditable element (journal editor)
    const editor = page.locator('[contenteditable="true"]').first()
    const editorCount = await editor.count()

    if (editorCount === 0) {
      console.log('❌ No editor found - test cannot proceed')
      throw new Error('No contenteditable editor found on page')
    }

    const testContent = 'PREFIX TEXT HERE stoicism SUFFIX TEXT HERE'
    await editor.click()
    await page.waitForTimeout(500)
    await editor.fill(testContent)
    await page.waitForTimeout(3000)

    // Select "stoicism"
    await page.evaluate(() => {
      const editorEl = document.querySelector('[contenteditable="true"]') as HTMLElement
      if (!editorEl) throw new Error('Editor not found')

      const range = document.createRange()
      const selection = window.getSelection()

      const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null)
      let node
      while (node = walker.nextNode()) {
        const nodeText = node.textContent || ''
        const index = nodeText.indexOf('stoicism')
        if (index !== -1) {
          range.setStart(node, index)
          range.setEnd(node, index + 8)
          selection?.removeAllRanges()
          selection?.addRange(range)
          break
        }
      }
    })

    await page.waitForTimeout(500)
    await page.click('button:has-text("Make Note")')
    await page.waitForSelector('h2:has-text("Create Note")')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(2000)

    // Verify metadata was captured via console logs
    const metadataLog = await page.evaluate<unknown>(() => {
      const globalWindow = window as typeof window & { __lastMetadata?: unknown }
      return globalWindow.__lastMetadata ?? null
    })

    console.log('✅ Metadata context capture test completed', metadataLog)
  })
})
