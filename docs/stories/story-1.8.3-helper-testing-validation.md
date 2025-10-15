# Story 1.8.3: Helper Testing & Validation - Brownfield Quality Assurance

**Story ID**: 1.8.3
**Epic**: Epic 1.8 - Helper System Enhancement
**Story Type**: Brownfield Testing & Validation
**Estimated Duration**: 2-3 days
**Priority**: High
**Status**: Pending (Blocked by Story 1.8.2)
**Created**: October 15, 2025

---

## User Story

**As a** QA engineer / product owner,
**I want** comprehensive end-to-end tests for the CBT Distortions helper,
**So that** I can verify the feature works correctly, maintains accessibility standards, and doesn't break existing functionality.

---

## Story Context

### Existing System Integration

**Testing Framework:**
- **Playwright** ^1.55 for E2E testing
- **Existing Test Patterns**: `tests/phase1-link-creation.spec.ts`, `tests/phase2-authenticated.spec.ts`
- **Test Screenshots**: `tests/screenshots/` directory
- **CI/CD**: Playwright runs on PR creation (GitHub Actions)

**Quality Standards:**
- **TypeScript Strict Mode**: All tests use TypeScript ^5
- **WCAG AA Compliance**: Accessibility testing with Playwright accessibility tools
- **Multi-user Testing**: RLS policy verification with 2+ users
- **Vercel Preview**: Mandatory testing on preview deployment before merge

**Dependencies:**
- Story 1.8.1 (Helper Database Infrastructure) - ✅ COMPLETE
- Story 1.8.2 (CBT Distortions Component) - 📝 IN PROGRESS

---

## Acceptance Criteria

### Playwright E2E Tests (10 scenarios)

1. **Helper Expansion**: Click "Explore" button expands helper panel
2. **Checkbox Selection**: Select multiple distortions, verify checkboxes state
3. **Continue Button**: Insert selected distortions, verify plain paragraph format
4. **Clear Button**: Deselect all checkboxes, verify empty state
5. **Panel Collapse**: After insertion, panel collapses automatically
6. **Auto-save Trigger**: Helper insertion triggers 2-second debounced save
7. **Keyboard Navigation**: Tab, Enter, Space, Escape navigate correctly
8. **Focus Management**: Focus returns to "Explore" button after collapse
9. **aria-live Announcements**: Screen reader announcement triggers with exact text
10. **Link Rehydration Compatibility**: Helper insertion doesn't interfere with links

### Manual Testing (Vercel Preview)

11. **Multi-user RLS Isolation**: User A can't see User B's helper_usage records
12. **Screen Reader Testing**: VoiceOver/NVDA announces all interactions correctly
13. **Existing Gentle Prompt**: Gentle Prompt still works unchanged
14. **Auto-save Coordination**: No conflicts with typing or link creation
15. **No Console Errors**: Clean browser console and terminal logs

### Documentation & Reporting

16. **Test Report**: Summary document with all passing tests and screenshots
17. **Vercel Preview Checklist**: 25+ items verified on preview deployment
18. **Accessibility Certification**: WCAG AA compliance verified

---

## Technical Implementation

### Phase 1: Playwright E2E Test Suite (1.5 days)

#### Create Test File

**File:** `tests/cbt-distortions-helper.spec.ts`

**Test Structure** (following existing patterns):

```typescript
import { test, expect } from '@playwright/test'

test.describe('CBT Distortions Helper', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as authenticated user
    await page.goto('/auth')
    // ... authentication logic
    await page.goto('/journal')
    await page.waitForSelector('[data-testid="journal-entry"]')
  })

  test('expands and collapses helper panel', async ({ page }) => {
    // Verify helper is collapsed initially
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()

    // Click Explore button
    await page.click('[data-testid="cbt-explore-button"]')

    // Verify panel expanded
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).toBeVisible()

    // Verify 10 distortions displayed
    const distortions = await page.locator('[data-testid^="distortion-"]').count()
    expect(distortions).toBe(10)
  })

  test('selects multiple distortions via checkboxes', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')

    // Select 3 distortions
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="distortion-overgeneralization-checkbox"]')
    await page.click('[data-testid="distortion-mental-filter-checkbox"]')

    // Verify checkboxes are checked
    await expect(page.locator('[data-testid="distortion-all-or-nothing-checkbox"]')).toBeChecked()
    await expect(page.locator('[data-testid="distortion-overgeneralization-checkbox"]')).toBeChecked()
    await expect(page.locator('[data-testid="distortion-mental-filter-checkbox"]')).toBeChecked()

    // Verify Continue button is enabled
    await expect(page.locator('[data-testid="cbt-continue-button"]')).toBeEnabled()
  })

  test('inserts selected distortions as plain paragraphs', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')

    // Select 2 distortions
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="distortion-emotional-reasoning-checkbox"]')

    // Click Continue
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for insertion
    await page.waitForTimeout(100)

    // Get journal entry content
    const content = await page.locator('[contenteditable]').innerHTML()

    // Verify plain paragraph format (not bullets or lists)
    expect(content).toContain('Today I experienced All-or-Nothing Thinking')
    expect(content).toContain('Today I experienced Emotional Reasoning')
    expect(content).toContain('Here\'s what happened:')

    // Verify no <ul>, <li>, or other list tags
    expect(content).not.toContain('<ul>')
    expect(content).not.toContain('<li>')
  })

  test('clears all selections when Clear button clicked', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')

    // Select 3 distortions
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="distortion-overgeneralization-checkbox"]')
    await page.click('[data-testid="distortion-mental-filter-checkbox"]')

    // Click Clear
    await page.click('[data-testid="cbt-clear-button"]')

    // Verify all checkboxes unchecked
    const checkboxes = await page.locator('[data-testid^="distortion-"][data-testid$="-checkbox"]').all()
    for (const checkbox of checkboxes) {
      await expect(checkbox).not.toBeChecked()
    }

    // Verify Continue button is disabled
    await expect(page.locator('[data-testid="cbt-continue-button"]')).toBeDisabled()
  })

  test('collapses panel after successful insertion', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for collapse animation
    await page.waitForTimeout(300)

    // Verify panel is collapsed
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()

    // Verify Explore button is visible again
    await expect(page.locator('[data-testid="cbt-explore-button"]')).toBeVisible()
  })

  test('triggers auto-save after helper insertion', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for 2-second debounce + buffer
    await page.waitForTimeout(2500)

    // Verify "Last saved" timestamp updated
    const timestamp = await page.locator('[data-testid="last-saved"]').textContent()
    expect(timestamp).toBeTruthy()

    // Refresh page
    await page.reload()
    await page.waitForSelector('[contenteditable]')

    // Verify content persisted
    const content = await page.locator('[contenteditable]').innerHTML()
    expect(content).toContain('Today I experienced All-or-Nothing Thinking')
  })

  test('supports keyboard navigation', async ({ page }) => {
    // Tab to Explore button
    await page.keyboard.press('Tab') // Multiple times to reach button
    await page.keyboard.press('Enter')

    // Verify panel expanded
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).toBeVisible()

    // Tab to first checkbox
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')

    // Verify first checkbox selected
    await expect(page.locator('[data-testid="distortion-all-or-nothing-checkbox"]')).toBeChecked()

    // Press Escape to collapse
    await page.keyboard.press('Escape')

    // Verify panel collapsed
    await expect(page.locator('[data-testid="cbt-helper-panel"]')).not.toBeVisible()
  })

  test('returns focus to Explore button after collapse', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for collapse
    await page.waitForTimeout(300)

    // Verify focus on Explore button
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(focusedElement).toBe('cbt-explore-button')
  })

  test('announces insertion to screen readers', async ({ page }) => {
    await page.click('[data-testid="cbt-explore-button"]')

    // Select 2 distortions
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="distortion-overgeneralization-checkbox"]')

    // Click Continue
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for announcement
    await page.waitForTimeout(100)

    // Verify aria-live region has exact text
    const announcement = await page.locator('[role="status"][aria-live="polite"]').textContent()
    expect(announcement).toBe('Inserted 2 distortion reflections')
  })

  test('does not interfere with link rehydration', async ({ page }) => {
    // Create a note link first
    await page.locator('[contenteditable]').fill('Test content')
    // Select the word "Test" by double-clicking
    await page.locator('[contenteditable]').dblclick()
    await page.click('[data-make-note-button]')
    await page.fill('#note-title', 'Test Note')
    await page.click('button:has-text("Create Note")')

    // Wait for link creation
    await page.waitForTimeout(100)

    // Verify link exists
    await expect(page.locator('a[data-note-id]')).toBeVisible()

    // Now insert helper text
    await page.click('[data-testid="cbt-explore-button"]')
    await page.click('[data-testid="distortion-all-or-nothing-checkbox"]')
    await page.click('[data-testid="cbt-continue-button"]')

    // Wait for insertion
    await page.waitForTimeout(100)

    // Refresh page to trigger link rehydration
    await page.reload()
    await page.waitForSelector('[contenteditable]')

    // Verify link still exists and is clickable
    await expect(page.locator('a[data-note-id]')).toBeVisible()

    // Verify helper text also persisted
    const content = await page.locator('[contenteditable]').innerHTML()
    expect(content).toContain('Today I experienced All-or-Nothing Thinking')
  })
})
```

**Test Data IDs Required** (to be added in Story 1.8.2):
- `data-testid="cbt-explore-button"` - Explore button
- `data-testid="cbt-helper-panel"` - Expandable panel
- `data-testid="distortion-{id}-checkbox"` - Each distortion checkbox (10 total)
- `data-testid="cbt-continue-button"` - Continue button
- `data-testid="cbt-clear-button"` - Clear button
- `data-testid="last-saved"` - Last saved timestamp

---

### Phase 2: Vercel Preview Testing Checklist (0.5 days)

#### Create Vercel Preview Checklist

**File:** `docs/qa/story-1.8.3-vercel-preview-checklist.md`

**Checklist Categories** (25+ items):

##### Functionality (8 items)
- [ ] 1. Helper displays on today's entry only (not on past entries)
- [ ] 2. Explore button expands panel smoothly
- [ ] 3. All 10 distortions displayed with descriptions and examples
- [ ] 4. Checkbox selection works (single and multiple)
- [ ] 5. Continue button inserts correct plain paragraph format
- [ ] 6. Clear button deselects all checkboxes
- [ ] 7. Panel collapses after insertion
- [ ] 8. Helper usage logged to Supabase (verify in database)

##### Integration (5 items)
- [ ] 9. Gentle Prompt still visible and functional
- [ ] 10. Helper doesn't interfere with Gentle Prompt interactions
- [ ] 11. Auto-save triggers after helper insertion (2 seconds)
- [ ] 12. Link creation still works correctly
- [ ] 13. Link rehydration after page refresh works

##### Accessibility (6 items)
- [ ] 14. Keyboard navigation: Tab, Enter, Space, Escape work correctly
- [ ] 15. Focus management: Focus returns to Explore button after collapse
- [ ] 16. Screen reader (VoiceOver): Announces "Inserted {count} distortion reflections"
- [ ] 17. Screen reader: All checkboxes announce distortion names correctly
- [ ] 18. Screen reader: Button states announced (enabled/disabled)
- [ ] 19. Color contrast meets WCAG AA (blue/indigo gradient readable)

##### Security (2 items)
- [ ] 20. Multi-user RLS: User A can't access User B's helper_usage via Supabase dashboard
- [ ] 21. Entry ownership: Can only insert helpers into own entries

##### Visual & Responsiveness (3 items)
- [ ] 22. Blue/indigo gradient distinct from amber Gentle Prompt
- [ ] 23. Responsive on mobile (iPhone 12/13 Pro viewport)
- [ ] 24. Responsive on tablet (iPad viewport)

##### Console & Performance (2 items)
- [ ] 25. No console errors in browser (F12 DevTools)
- [ ] 26. No terminal errors during helper usage
- [ ] 27. Helper expansion/collapse animation smooth (no janky frames)

---

### Phase 3: Manual Testing & Certification (1 day)

#### Multi-user RLS Testing

**Test Procedure**:

1. **User A Setup**:
   - Sign in to Vercel preview as User A
   - Insert helper text in journal entry
   - Note `helper_usage` record ID from Supabase dashboard

2. **User B Attempt**:
   - Sign out, sign in as User B
   - Try to query User A's helper_usage via Supabase dashboard
   - Expected: RLS policy blocks access (PGRST116 error)

3. **Verification**:
   - Run SQL query: `SELECT * FROM helper_usage WHERE user_id != auth.uid()`
   - Expected: 0 rows returned (RLS blocks)

**Pass Criteria**: User B cannot see User A's helper_usage records

---

#### Screen Reader Accessibility Testing

**Test Procedure** (VoiceOver on Mac):

1. **Enable VoiceOver**: Cmd + F5
2. **Navigate to Journal**: Use VoiceOver navigation (VO + arrow keys)
3. **Test Scenarios**:
   - Explore button: Announces "Explore button"
   - Panel expansion: Announces "CBT Distortions helper expanded. 10 distortions available."
   - Checkbox selection: Announces "Selected {distortion name}"
   - Continue button: Announces "Inserted 2 distortion reflections"
   - Panel collapse: Announces "CBT Distortions helper collapsed"

**Pass Criteria**: All announcements match exact specification from Issue #17, Comment 3

---

#### Auto-save Coordination Testing

**Test Procedure**:

1. **Baseline**: Type in journal, wait 2 seconds, verify save
2. **Helper Insertion**: Insert helper text, wait 2 seconds, verify save
3. **Mixed Workflow**:
   - Type "Test content"
   - Insert helper text (Don't wait for save)
   - Immediately type more content
   - Wait 2 seconds
   - Verify both typed text and helper text persisted

**Pass Criteria**: No content loss, no duplicate saves, clean auto-save behavior

---

## Definition of Done

- [ ] **Playwright E2E tests complete:**
  - [ ] All 10 test scenarios written
  - [ ] Tests pass on localhost (`npx playwright test tests/cbt-distortions-helper.spec.ts`)
  - [ ] Tests pass on Vercel preview deployment
  - [ ] Screenshots captured for passing tests

- [ ] **Vercel preview testing complete:**
  - [ ] All 27 checklist items verified
  - [ ] No console errors or warnings
  - [ ] No terminal errors or warnings
  - [ ] Screenshots captured for visual verification

- [ ] **Manual testing complete:**
  - [ ] Multi-user RLS isolation verified (User A ≠ User B)
  - [ ] Screen reader testing passed (VoiceOver or NVDA)
  - [ ] Auto-save coordination tested and working
  - [ ] Link rehydration compatibility confirmed

- [ ] **Documentation updated:**
  - [ ] Test report created with summary and screenshots
  - [ ] Vercel preview checklist completed
  - [ ] Accessibility certification documented
  - [ ] Dev Agent Record updated in this story file

- [ ] **Quality assurance:**
  - [ ] No regression in existing journaling flow
  - [ ] No regression in Gentle Prompts functionality
  - [ ] No regression in link creation/rehydration
  - [ ] All acceptance criteria met

- [ ] **Story completion:**
  - [ ] All tests green in CI/CD (GitHub Actions)
  - [ ] Story 1.8.3 marked as complete
  - [ ] Epic 1.8 ready for final deployment

---

## Risk Assessment

### Primary Risk: Flaky Playwright Tests

**Risk Description**: Tests might be flaky due to timing issues (auto-save debounce, animation timing, DOM updates).

**Likelihood:** Medium (async operations with timeouts)

**Impact:** Low (delays testing, but fixable)

**Mitigation:**
1. Use `page.waitForSelector` instead of `waitForTimeout` where possible
2. Add explicit waits for network idle: `page.waitForLoadState('networkidle')`
3. Increase timeout buffers for debounced operations (2500ms instead of 2000ms)
4. Use Playwright's auto-retry mechanism for assertions

**Rollback Plan:** N/A (testing-only story, no production code changes)

---

### Secondary Risk: Screen Reader Testing Requires Manual Verification

**Risk Description**: Playwright can test aria-live region content, but cannot verify actual screen reader audio output.

**Likelihood:** High (automated tools can't test audio)

**Impact:** Medium (requires manual QA time)

**Mitigation:**
1. Playwright tests verify aria-live region text content
2. Manual VoiceOver/NVDA testing confirms audible announcements
3. Document exact testing procedure for future regression testing

**Rollback Plan:** N/A (testing-only story)

---

## Testing Strategy

### Automated Testing (Playwright)

**Coverage:**
- ✅ UI interactions (expand, select, insert, clear, collapse)
- ✅ Keyboard navigation (Tab, Enter, Space, Escape)
- ✅ Focus management
- ✅ aria-live region content (text verification)
- ✅ Auto-save triggering
- ✅ Content persistence
- ✅ Link rehydration compatibility

**Limitations:**
- ❌ Cannot test actual screen reader audio output
- ❌ Cannot test multi-user RLS (requires 2 separate auth sessions)
- ❌ Cannot test Supabase database writes directly

---

### Manual Testing (Vercel Preview)

**Coverage:**
- ✅ Multi-user RLS isolation (2+ users)
- ✅ Screen reader audio announcements (VoiceOver/NVDA)
- ✅ Visual responsiveness (mobile, tablet, desktop)
- ✅ Browser console errors
- ✅ Supabase database verification

**Limitations:**
- ❌ Time-consuming (requires human QA)
- ❌ Not automated (manual checklist each time)

---

## Validation Checklist

### Scope Validation

- [x] Story scope is clear (E2E testing and validation)
- [x] Testing approach covers all acceptance criteria
- [x] Playwright tests follow existing patterns
- [x] Estimated at 2-3 days (realistic timeline)

### Completeness Check

- [x] 10 Playwright test scenarios defined
- [x] 27 Vercel preview checklist items defined
- [x] Manual testing procedures documented
- [x] Pass criteria clearly defined for each test

### Dependencies Check

- [x] Story 1.8.1 (Helper Database Infrastructure) is complete
- [x] Story 1.8.2 (CBT Distortions Component) is in progress
- [x] Test data IDs will be added in Story 1.8.2

---

## Related Documentation

### Issue #17 Documentation (4,000+ lines)

1. **Original Issue:** [#17](https://github.com/levineam/Signum/issues/17) - UX requirements, accessibility
2. **Codex Integration:** [Comment 3](https://github.com/levineam/Signum/issues/17#issuecomment-3403523034) - Exact aria-live format, deterministic specs

### Project Documentation

- **Epic 1.8:** `docs/stories/epic-1.8-helper-system-enhancement.md` - Full epic specification
- **Story 1.8.1:** `docs/stories/story-1.8.1-helper-database-infrastructure.md` ✅ COMPLETE
- **Story 1.8.2:** `docs/stories/story-1.8.2-cbt-distortions-component.md` 📝 IN PROGRESS
- **Existing Tests:** `tests/phase1-link-creation.spec.ts`, `tests/phase2-authenticated.spec.ts`
- **CLAUDE.md:** `.claude/CLAUDE.md` - PR-based workflow, Vercel preview requirements

---

## Dev Agent Record

_This section will be updated by the Dev Agent during implementation._

### Files Created

- [ ] `tests/cbt-distortions-helper.spec.ts` - Playwright E2E test suite (NEW)
- [ ] `docs/qa/story-1.8.3-vercel-preview-checklist.md` - Manual testing checklist (NEW)
- [ ] `docs/qa/story-1.8.3-test-report.md` - Final test report with screenshots (NEW)

### Test Results

_To be completed after test execution._

**Playwright Results:**
- Test scenarios: 0/10 passing (pending Story 1.8.2 completion)
- Duration: N/A
- Screenshots: N/A

**Vercel Preview Results:**
- Checklist items: 0/27 verified
- Multi-user RLS: Not tested
- Screen reader: Not tested

### Change Log

_Chronological log of significant changes during testing._

### Status

**Current Status:** Pending - Blocked by Story 1.8.2
**Blockers:** Story 1.8.2 (CBT Distortions Component) must be implemented first
**Next Steps:** Wait for Story 1.8.2 completion, then begin Phase 1 (Playwright E2E tests)

---

**Story Status:** 📋 **READY FOR IMPLEMENTATION** (after Story 1.8.2 completes)

**Next Action:** Wait for Story 1.8.2 to be merged to `dev`, then begin Playwright E2E test implementation.
