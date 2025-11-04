# Story 1.9.8: E2E and Unit Tests for 'Ask AI' Flow

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#128](https://github.com/levineam/Signum/issues/128)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a developer,
I want comprehensive tests for the "Ask AI" feature,
so that I can ensure reliability, catch regressions, and maintain code quality.

## Acceptance Criteria

1. **Unit Tests for Query Detection** (Story 1.9.1)
   - [ ] Test clear queries (interrogative words, question marks, research keywords)
   - [ ] Test clear actions (action verbs, time/date focus)
   - [ ] Test edge cases (hybrid tasks, ambiguous phrasing)
   - [ ] Test confidence scoring accuracy
   - [ ] Coverage >90% for `queryDetection.ts`

2. **Unit Tests for Rate Limiting** (Story 1.9.6)
   - [ ] Test rate limit check (allowed vs. exceeded)
   - [ ] Test rate limit counter increment
   - [ ] Test rate limit reset at midnight UTC
   - [ ] Test concurrent request handling
   - [ ] Coverage >80% for `rateLimiting.ts`

3. **API Route Tests** (Story 1.9.3)
   - [ ] Test successful AI answer generation
   - [ ] Test authentication errors (401)
   - [ ] Test invalid task ID (404)
   - [ ] Test rate limit exceeded (429)
   - [ ] Test OpenAI API failures (500)
   - [ ] Test feature flag disabled (403)
   - [ ] Coverage >80% for `/api/ai/answer/route.ts`

4. **Integration Tests**
   - [ ] Test note creation from AI response (Story 1.9.4)
   - [ ] Test task-note linking (bidirectional)
   - [ ] Test ontology exclusion for AI-generated notes (Story 1.9.5)
   - [ ] Test "Add to Ontology" toggle (Story 1.9.5)
   - [ ] Test analytics event logging (Story 1.9.7)

5. **E2E Tests (Playwright)**
   - [ ] Full flow: Create query task → Click "Ask AI" → Verify note created → Verify linked to task
   - [ ] Test "Ask AI" button appears only on query tasks
   - [ ] Test rate limit UI (button disabled when limit reached)
   - [ ] Test error handling (network error, timeout)
   - [ ] Test "Add to Ontology" toggle in UI

6. **Test Coverage**
   - [ ] Overall test coverage >80% for new code
   - [ ] All critical paths tested (happy path + error cases)
   - [ ] Tests run in CI/CD pipeline

## Tasks / Subtasks

- [ ] **Unit Tests: Query Detection** (AC: #1)
  - [ ] Create `/tests/unit/queryDetection.test.ts`
  - [ ] Test cases:
    - Clear queries: "What is X?", "How does Y work?", "Research Z"
    - Clear actions: "Call mom", "Buy groceries", "Schedule meeting"
    - Hybrid tasks: "Research dentists and schedule appointment"
    - Edge cases: "Find my keys" vs "Find information about keys"
  - [ ] Test confidence scoring (0-1 range, correct thresholds)
  - [ ] Achieve >90% coverage

- [ ] **Unit Tests: Rate Limiting** (AC: #2)
  - [ ] Create `/tests/unit/rateLimiting.test.ts`
  - [ ] Test cases:
    - Check rate limit with 0 requests: allowed, remaining = 10
    - Check rate limit with 10 requests: not allowed, remaining = 0
    - Increment counter: count increases by 1
    - Reset at midnight: count reset to 0, reset_date updated
  - [ ] Mock Supabase client for isolation
  - [ ] Achieve >80% coverage

- [ ] **API Route Tests** (AC: #3)
  - [ ] Create `/tests/api/ai-answer.test.ts`
  - [ ] Mock OpenAI API (use `jest.mock` or similar)
  - [ ] Mock Supabase client
  - [ ] Test cases:
    - Success: Returns 200 with answer, noteId, tokensUsed
    - Auth error: Returns 401 when not authenticated
    - Invalid task: Returns 404 when task not found
    - Rate limit: Returns 429 when daily limit exceeded
    - OpenAI error: Returns 500 on OpenAI API failure
    - Feature disabled: Returns 403 when feature flag off
  - [ ] Achieve >80% coverage

- [ ] **Integration Tests: Note Creation** (AC: #4)
  - [ ] Create `/tests/integration/ai-note-creation.test.ts`
  - [ ] Test cases:
    - AI response creates note in database
    - Note has `ai_generated = true`
    - Note has `source_task_id` set correctly
    - Note appears in journal stream
  - [ ] Use test database or transaction rollback

- [ ] **Integration Tests: Ontology Exclusion** (AC: #4)
  - [ ] Create `/tests/integration/ontology-isolation.test.ts`
  - [ ] Test cases:
    - AI-generated notes excluded from ontology query
    - Toggle `ai_generated = false` includes note in ontology
    - Analytics event logged on toggle

- [ ] **E2E Tests: Full "Ask AI" Flow** (AC: #5)
  - [ ] Create `/tests/e2e/ask-ai-flow.spec.ts` (Playwright)
  - [ ] Test flow:
    1. User logs in
    2. Create journal entry with query: "What is quantum physics?"
    3. Task auto-created (Story 1.2)
    4. Task detected as query (Story 1.9.1)
    5. "Ask AI" button appears
    6. Click "Ask AI" button
    7. Loading state shown
    8. Note created with AI response
    9. Note appears in journal stream with "AI-generated" badge
    10. Note linked to task
  - [ ] Mock OpenAI API to avoid real API calls

- [ ] **E2E Tests: Rate Limiting** (AC: #5)
  - [ ] Test flow:
    1. User logs in
    2. Make 10 AI requests (button clicks)
    3. 11th request: button disabled, tooltip shows "Daily limit reached"
    4. API returns 429 error

- [ ] **E2E Tests: "Add to Ontology" Toggle** (AC: #5)
  - [ ] Test flow:
    1. Create AI-generated note
    2. Note shows "Excluded from Ontology" badge
    3. Click "Add to Ontology" toggle
    4. Badge updates to show inclusion
    5. Ontology query includes note

- [ ] **E2E Tests: Error Handling** (AC: #5)
  - [ ] Test cases:
    - Network error: Toast notification shown, "Try Again" button
    - OpenAI timeout: Error message shown
    - Invalid task: Error message shown

- [ ] **Setup CI/CD Test Pipeline** (AC: #6)
  - [ ] Add test commands to `package.json`:
    - `npm run test:unit` - Unit tests
    - `npm run test:integration` - Integration tests
    - `npm run test:e2e` - E2E tests (Playwright)
  - [ ] Configure GitHub Actions to run tests on PR
  - [ ] Fail PR if tests fail or coverage drops below 80%

- [ ] **Mock OpenAI API for Tests** (AC: #3, #5)
  - [ ] Create `/tests/mocks/openai.ts`
  - [ ] Mock successful response with sample answer
  - [ ] Mock rate limit error (429)
  - [ ] Mock timeout error

- [ ] **Mock Supabase for Unit Tests** (AC: #2, #3)
  - [ ] Create `/tests/mocks/supabase.ts`
  - [ ] Mock database queries (select, insert, update)
  - [ ] Mock authentication (session)

## Dev Notes

### Technical Summary

Create comprehensive test coverage for the "Ask AI" feature, including unit tests for query detection and rate limiting, API route tests for error handling, integration tests for database operations, and E2E tests for full user flows.

### Implementation Approach

**Unit Test: Query Detection:**

```typescript
// /tests/unit/queryDetection.test.ts
import { detectQuery } from '@/utils/nlp/queryDetection'

describe('Query Detection', () => {
  describe('Clear Queries', () => {
    it('detects interrogative questions', () => {
      const result = detectQuery('What is quantum physics?')
      expect(result.isQuery).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('detects research keywords', () => {
      const result = detectQuery('Research Wheeler\'s "It from bit" statement')
      expect(result.isQuery).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('detects question marks', () => {
      const result = detectQuery('Is AI dangerous?')
      expect(result.isQuery).toBe(true)
    })
  })

  describe('Clear Actions', () => {
    it('detects action verbs', () => {
      const result = detectQuery('Call mom tomorrow')
      expect(result.isQuery).toBe(false)
      expect(result.confidence).toBeLessThan(0.4)
    })

    it('detects time/date focus', () => {
      const result = detectQuery('Buy groceries at 5pm')
      expect(result.isQuery).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles hybrid tasks (defaults to action)', () => {
      const result = detectQuery('Research dentists and schedule appointment')
      expect(result.isQuery).toBe(false)
    })

    it('distinguishes "find" meanings', () => {
      const actionFind = detectQuery('Find my keys')
      expect(actionFind.isQuery).toBe(false)

      const queryFind = detectQuery('Find information about AI ethics')
      expect(queryFind.isQuery).toBe(true)
    })
  })
})
```

**API Route Test:**

```typescript
// /tests/api/ai-answer.test.ts
import { POST } from '@/app/api/ai/answer/route'
import { createMocks } from 'node-mocks-http'

// Mock dependencies
jest.mock('openai')
jest.mock('@/utils/supabase/server')

describe('/api/ai/answer', () => {
  it('returns 200 with AI answer on success', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { taskId: 'task-123', taskText: 'What is quantum physics?' }
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('answer')
    expect(data).toHaveProperty('noteId')
    expect(data).toHaveProperty('tokensUsed')
  })

  it('returns 401 when not authenticated', async () => {
    // Mock unauthenticated session
    const { req } = createMocks({ method: 'POST' })
    const response = await POST(req)

    expect(response.status).toBe(401)
  })

  it('returns 429 when rate limit exceeded', async () => {
    // Mock rate limit exceeded
    const { req } = createMocks({
      method: 'POST',
      body: { taskId: 'task-123', taskText: 'What is X?' }
    })

    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})
```

**E2E Test (Playwright):**

```typescript
// /tests/e2e/ask-ai-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Ask AI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/journal')
  })

  test('full Ask AI flow: create query task, click Ask AI, verify note created', async ({ page }) => {
    // 1. Create journal entry with query
    await page.fill('[data-testid="journal-input"]', 'What is quantum physics?')
    await page.click('[data-testid="submit-entry"]')

    // 2. Wait for task to be created (Story 1.2)
    await page.waitForSelector('[data-testid="task-card"]')

    // 3. Verify "Ask AI" button appears
    const askAIButton = page.locator('[data-testid="ask-ai-button"]')
    await expect(askAIButton).toBeVisible()

    // 4. Click "Ask AI" button
    await askAIButton.click()

    // 5. Verify loading state
    await expect(page.locator('text=Generating...')).toBeVisible()

    // 6. Wait for note to be created
    await page.waitForSelector('[data-testid="ai-generated-note"]', { timeout: 15000 })

    // 7. Verify note appears with AI-generated badge
    const noteCard = page.locator('[data-testid="ai-generated-note"]')
    await expect(noteCard).toBeVisible()
    await expect(noteCard.locator('text=AI-generated')).toBeVisible()

    // 8. Verify note content exists
    const noteContent = noteCard.locator('.note-content')
    await expect(noteContent).not.toBeEmpty()
  })

  test('rate limit: button disabled after 10 requests', async ({ page }) => {
    // Make 10 AI requests
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="journal-input"]', `What is topic ${i}?`)
      await page.click('[data-testid="submit-entry"]')
      await page.click('[data-testid="ask-ai-button"]')
      await page.waitForSelector('[data-testid="ai-generated-note"]')
    }

    // 11th request: button should be disabled
    await page.fill('[data-testid="journal-input"]', 'What is topic 11?')
    await page.click('[data-testid="submit-entry"]')

    const askAIButton = page.locator('[data-testid="ask-ai-button"]')
    await expect(askAIButton).toBeDisabled()

    // Verify tooltip
    await askAIButton.hover()
    await expect(page.locator('text=Daily limit reached')).toBeVisible()
  })

  test('Add to Ontology toggle updates note status', async ({ page }) => {
    // Create AI note (follow flow from test 1)
    // ...

    // Click "Add to Ontology" toggle
    const toggle = page.locator('[data-testid="add-to-ontology-toggle"]')
    await toggle.click()

    // Verify badge updates
    await expect(page.locator('text=Included in Ontology')).toBeVisible()
  })
})
```

### Files to Create

**Unit Tests:**
- `/tests/unit/queryDetection.test.ts`
- `/tests/unit/rateLimiting.test.ts`

**API Tests:**
- `/tests/api/ai-answer.test.ts`

**Integration Tests:**
- `/tests/integration/ai-note-creation.test.ts`
- `/tests/integration/ontology-isolation.test.ts`
- `/tests/integration/analytics.test.ts`

**E2E Tests:**
- `/tests/e2e/ask-ai-flow.spec.ts`
- `/tests/e2e/rate-limiting.spec.ts`
- `/tests/e2e/ontology-toggle.spec.ts`

**Mocks:**
- `/tests/mocks/openai.ts`
- `/tests/mocks/supabase.ts`

### Dependencies

- **All previous stories (1.9.1 - 1.9.7):** Must be completed first
- **Playwright:** Already installed for E2E tests
- **Jest:** For unit and API tests (or Vitest if preferred)
- **Testing Library:** For React component tests

### Test Data Management

**Unit Tests:**
- Use hardcoded test cases
- Mock all external dependencies (Supabase, OpenAI)

**Integration Tests:**
- Use test database or transactions with rollback
- Seed test data before each test

**E2E Tests:**
- Use Playwright's `beforeEach` to setup test user
- Clean up test data after each test
- Mock OpenAI API to avoid real costs

### CI/CD Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Coverage Goals

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Query Detection | >90% | High |
| Rate Limiting | >80% | High |
| API Routes | >80% | High |
| Integration | >70% | Medium |
| E2E (Critical Paths) | 100% | High |

### Time Estimate

**2-3 days**
- Day 1: Unit tests (query detection, rate limiting), mocks
- Day 2: API tests, integration tests
- Day 3: E2E tests, CI/CD setup, coverage verification

**Story Points:** 3 points

### References

- **Playwright Docs:** https://playwright.dev/docs/intro
- **Jest Docs:** https://jestjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Existing Tests:** `/tests/` (follow existing patterns)

---

## Dev Agent Record

### Context Reference

<!-- Will be populated during dev-story execution -->

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
