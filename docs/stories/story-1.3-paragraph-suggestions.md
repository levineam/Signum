# Story 1.3: Paragraph Detection & Suggestion Card UI (Task Suggestions Only)

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: Draft

## Story

As a **journaling user**,
I want **to receive a task suggestion after I finish writing a paragraph that mentions an action**,
so that **I get immediate value from my journaling without waiting for batch processing**.

**Note:** This story focuses on **task-only suggestions** to validate the core feedback loop. Person/link suggestions are deferred to a follow-up story after acceptance rates are validated (target: ≥25% acceptance).

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Real-time AI suggestion feature
- **Existing System Impact:** Modifies SimpleRichEditor component, adds new API routes
- **Dependencies:** Story 1.1 (NLP infrastructure must be complete)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** Paragraph boundary detection implemented
- `SimpleRichEditor.tsx` modified to detect paragraph completion via blank line (`\n\n`) or Enter + 1.2s idle
- Detection uses debounced `onInput` handler (1200ms debounce, non-blocking)
- Pasted text blocks: segment by `\n\n`, process first 3 paragraphs immediately, queue remainder for async processing
- Extracts paragraph text (plain text via `textContent`, no HTML) when boundary detected
- Does NOT interfere with cursor position, text selection, or existing formatting

**AC2:** Suggestion API route functional (TASK-ONLY MVP)
- `POST /api/suggestions/paragraph` endpoint created
- Accepts `{ paragraphText: string, userId: string, entryId: string }`
- Calls NLP utilities from Story 1.1: term extraction, entity recognition (NO embeddings in MVP)
- **Simplified Scoring:** Keyword-based intent detection for task suggestions only
- Returns task suggestion if confidence ≥ 0.5, else returns `null`
- Response format: `{ type: 'task', title: string, rationale: string, confidence: number }`
- Achieves P95 latency < 200ms (no embedding overhead in MVP)
- Server-side rate limiting: max 30 suggestions per user per minute

**AC3:** Suggestion card component working (TASK-ONLY MVP)
- `SuggestionCard.tsx` component created in `/src/components/intelligence/`
- Displays suggestion `title` and `rationale` in shadcn/ui Card with Notebook theme styling
- Two buttons: "Add" (primary), "Later" (secondary)
- "Add" button calls `/api/tasks/parse` from Story 1.2 (task suggestions only)
- "Later" button dismisses card, logs dismissal for analytics
- Card appears as overlay near paragraph cursor position (non-modal)
- Card auto-dismisses after 30 seconds if no interaction

**AC4:** Suggestion scoring algorithm implemented (TASK-ONLY SIMPLIFIED)
- Scoring function in `/src/utils/nlp/scoring.ts`
- **Simplified formula:** `score = intent_confidence + recency_boost`
- Intent confidence: count action verbs ("should", "need to", "want to", "plan to", "must") / total words (0-1)
- Recency boost: check if paragraph mentions entities seen in last 7 days (+0.3 to score)
- Confidence threshold: ≥ 0.5 to display suggestion
- **Deferred to Phase 2:** Embeddings, similarity scoring, complex multi-factor formulas

**AC5:** Acceptance rate tracking enabled (TASK-ONLY)
- Track "Add" vs "Later" button clicks in analytics
- Store suggestion logs: `{ user_id, suggestion_type: 'task', accepted: boolean, created_at }`
- Target: ≥25% acceptance rate before expanding to person/link suggestions (Phase 2)

### Integration Requirements

**AC6:** Existing journal editor functionality intact
- Formatting toolbar works (bold, italic, etc.)
- Text selection works
- "Make Note" popup (existing feature) still functions
- No typing lag or perceptible latency increase

**AC7:** No breaking changes to journal entry saving
- Journal entries still save correctly to `notes` table
- Suggestion generation happens asynchronously (doesn't block save)

**AC8:** Performance maintained
- Lighthouse performance score ≥90 for journal page
- Typing latency measured via custom profiling logger < 16ms (60fps)

---

## Dev Technical Guidance

### Existing System Context

**Editor Component:**
- Location: `/src/components/editor/SimpleRichEditor.tsx`
- Uses `contentEditable` div with custom formatting logic
- Existing handlers: `onInput`, `onKeyDown`, `onSelect`
- Existing state: selection range, formatting state
- **Required Props:** `entryId` (string) - current journal entry ID for linking tasks/suggestions back to source entry

**Journal Entry Saving:**
- Saves on blur or explicit "Save" action
- Stored in `notes` table with `note_type = 'journal-entry'`
- Contains HTML content (formatted text)
- Entry ID is passed to SimpleRichEditor as `entryId` prop

### Integration Approach

**Paragraph Detection Strategy:**
1. Add debounced `onInput` handler (1200ms delay)
2. On trigger: extract text content, check for paragraph boundary
3. Conditions: `\n\n` (double newline) OR single `\n` + 1.2s no further input
4. Extract paragraph: get text between last `\n\n` and current cursor position
5. Fire suggestion API call with paragraph text
6. Display SuggestionCard when API returns with confidence ≥ 0.5

**State Management:**
- Add React state: `currentSuggestion: Suggestion | null`
- Add React state: `suggestionCardVisible: boolean`
- Use `useCallback` for debounced paragraph detection
- Store suggestion card position relative to cursor
- Pass `entryId` prop to SimpleRichEditor from parent component (journal page)
- Pass `entryId` to SuggestionCard via props so "Add" button can call Story 1.3 API with required `entryId` parameter

**API Route Implementation:**
- Use Next.js App Router: `/src/app/api/suggestions/paragraph/route.ts`
- Import NLP utilities from Story 1.1
- Query Supabase for user's notes (for similarity scoring)
- Query Supabase for user's entities (for recency scoring)
- Return JSON response with suggestion or null

### Technical Constraints

**Performance Targets:**
- P95 < 200ms for suggestion API (cache hit path)
- P50 < 100ms for term extraction + entity recognition (no embedding)
- Typing latency must stay < 16ms (use `requestIdleCallback` for async work)

**Bundle Size:**
- Suggestion card component must be code-split (lazy load)
- NLP utilities run server-side only (not bundled to client)

**Error Handling:**
- If suggestion API fails: silently skip suggestion (no error toast)
- If embedding API fails: fallback to keyword-only scoring
- If rate limit hit: return 429, client displays nothing

### File Locations

Modify:
- `/src/components/editor/SimpleRichEditor.tsx` (add paragraph detection)

Create:
- `/src/components/intelligence/SuggestionCard.tsx` (suggestion UI)
- `/src/app/api/suggestions/paragraph/route.ts` (API endpoint)
- `/src/utils/nlp/scoring.ts` (scoring algorithm)
- `/src/utils/profiling.ts` (typing latency logger)

---

## Tasks / Subtasks

### Task 1: Paragraph Detection in Editor

- [ ] Add paragraph detection to SimpleRichEditor
  - [ ] Import `useCallback`, `useRef` from React
  - [ ] Create debounced handler: `const detectParagraph = useCallback(debounce(() => { ... }, 1200), [])`
  - [ ] Attach to `onInput` event
  - [ ] Extract current paragraph text: get text between last `\n\n` and cursor
  - [ ] Check for boundary: `text.includes('\n\n')` OR (single `\n` + 1.2s idle)
  - [ ] Call `fetchSuggestion(paragraphText)` when boundary detected

- [ ] Handle pasted text
  - [ ] Detect paste event: `onPaste` handler
  - [ ] Segment pasted text by `\n\n` into paragraphs
  - [ ] Process first 3 paragraphs immediately
  - [ ] Queue remaining paragraphs for async processing (use `setTimeout`)

- [ ] Preserve existing functionality
  - [ ] Test: cursor position unchanged after paragraph detection
  - [ ] Test: text selection still works
  - [ ] Test: formatting toolbar still works
  - [ ] Test: "Make Note" popup still triggers on text selection

### Task 2: Suggestion API Route

- [ ] Create API route `/api/suggestions/paragraph/route.ts`
  - [ ] Accept POST with `{ paragraphText, userId, entryId }`
  - [ ] Validate inputs (paragraphText 1-5000 chars, userId UUID)
  - [ ] Get user from Supabase auth using Next.js App Router pattern:
    ```ts
    import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
    import { cookies } from 'next/headers'

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || user.id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    ```
  - [ ] Check rate limit: query recent suggestions count, return 429 if > 30/min

- [ ] Call NLP utilities (NO embeddings in MVP - defer to phase 2)
  - [ ] `const terms = extractTerms(paragraphText)` (from Story 1.1)
  - [ ] `const entities = recognizeEntities(paragraphText)` (from Story 1.1)
  - [ ] **Skip embeddings** - use keyword-based scoring only for initial validation

- [ ] Score suggestions
  - [ ] Query user's notes: `SELECT * FROM notes WHERE user_id = userId`
  - [ ] Query user's entities: `SELECT * FROM entities WHERE user_id = userId`
  - [ ] Call `scoreSuggestions(paragraphText, terms, entities, notes, embedding)` (Task 3)
  - [ ] Get top suggestion with confidence ≥ 0.5

- [ ] Return response
  - [ ] If suggestion found: `return { type, title, rationale, confidence }`
  - [ ] If no suggestion: `return { suggestion: null }`
  - [ ] Log to analytics: `INSERT INTO suggestion_logs (user_id, suggestion_type, accepted, created_at)`

### Task 3: Scoring Algorithm

- [ ] Implement scoring function `/src/utils/nlp/scoring.ts` (TASK-ONLY MVP)
  - [ ] Function signature: `scoreTaskSuggestion(paragraphText, terms, entities): Suggestion | null`
  - [ ] Generate task suggestion candidate:
    - **Task suggestion:** Detect action verbs ("should", "need to", "want to", "plan to", "must", "todo"), extract action phrase

- [ ] Compute intent confidence (simplified for task-only)
  - [ ] Task intent: count action verbs / total words (0-1)
  - [ ] Recency boost: check if paragraph mentions entities seen in last 7 days (+0.3 to score)

- [ ] Compute final score
  - [ ] Simplified formula: `score = intent_confidence + recency_boost`
  - [ ] Confidence threshold: ≥ 0.5

- [ ] Return task suggestion or null
  - [ ] If score ≥ 0.5: return `{ type: 'task', title, rationale, confidence }`
  - [ ] Else return `null`

### Task 4: Suggestion Card Component

- [ ] Create SuggestionCard component `/src/components/intelligence/SuggestionCard.tsx`
  - [ ] Props: `{ suggestion: Suggestion, onAdd: () => void, onDismiss: () => void, position: { x, y } }`
  - [ ] Use shadcn/ui Card component with Notebook theme
  - [ ] Display `suggestion.title` (bold, 16px)
  - [ ] Display `suggestion.rationale` (normal, 14px, muted color)
  - [ ] Two buttons: "Add" (primary), "Later" (secondary)

- [ ] Position card near cursor
  - [ ] Use `position` prop to set `style={{ top: position.y, left: position.x }}`
  - [ ] Add CSS: `position: absolute, z-index: 1000`
  - [ ] Ensure card doesn't overflow viewport (adjust if too close to edge)

- [ ] Handle "Add" button (TASK-ONLY MVP)
  - [ ] Call `onAdd()` callback
  - [ ] Obtain `entryId` from editor component (passed via props/context)
  - [ ] Obtain `userId` from Supabase session
  - [ ] Call `/api/tasks/parse` with `{ paragraphText, userId, entryId }` (per Story 1.2 API contract)
  - [ ] Show success toast: "Task added"
  - [ ] Dismiss card

- [ ] Handle "Later" button
  - [ ] Call `onDismiss()` callback
  - [ ] Log dismissal: `INSERT INTO suggestion_logs (user_id, suggestion_type, accepted = false)`
  - [ ] Dismiss card

- [ ] Auto-dismiss after 30 seconds
  - [ ] Use `useEffect` with `setTimeout(onDismiss, 30000)`
  - [ ] Clear timeout on unmount

### Task 5: Integration with Editor

- [ ] Add suggestion state to SimpleRichEditor
  - [ ] `const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null)`
  - [ ] `const [suggestionPosition, setSuggestionPosition] = useState<{ x, y } | null>(null)`

- [ ] Fetch suggestion on paragraph boundary
  - [ ] In `detectParagraph` callback: call `POST /api/suggestions/paragraph`
  - [ ] On response: if suggestion exists, `setCurrentSuggestion(suggestion)` and `setSuggestionPosition({ x: cursorX, y: cursorY })`
  - [ ] Get cursor position: use `window.getSelection().getRangeAt(0).getBoundingClientRect()`

- [ ] Render SuggestionCard conditionally
  - [ ] `{currentSuggestion && <SuggestionCard suggestion={currentSuggestion} position={suggestionPosition} onAdd={handleAdd} onDismiss={handleDismiss} />}`
  - [ ] Lazy load component: `const SuggestionCard = lazy(() => import('@/components/intelligence/SuggestionCard'))`

- [ ] Handle Add/Dismiss
  - [ ] `handleAdd`: execute add logic (create task/link), then `setCurrentSuggestion(null)`
  - [ ] `handleDismiss`: `setCurrentSuggestion(null)`

### Task 6: Performance Profiling

- [ ] Create profiling utility `/src/utils/profiling.ts`
  - [ ] Function: `measureTypingLatency(callback: () => void): number`
  - [ ] Use `performance.now()` before and after callback
  - [ ] Log latency if > 16ms: `console.warn('Typing latency:', latency)`
  - [ ] Return latency

- [ ] Add profiling to editor onInput
  - [ ] Wrap existing `onInput` handler: `const latency = measureTypingLatency(() => { ... })`
  - [ ] Track P95 latency over 100 keystrokes (store in array, calculate 95th percentile)
  - [ ] Display in dev tools console if P95 > 16ms

### Task 7: Testing

- [ ] Unit tests for scoring algorithm (Vitest)
  - [ ] Test task suggestion: "I need to call Mom tomorrow" → type: task, title: "Call Mom", confidence > 0.5
  - [ ] Test no suggestion: generic paragraph → confidence < 0.5, return null
  - [ ] **Skip person/link suggestion tests** - deferred to phase 2

- [ ] Integration test for API route (Playwright)
  - [ ] POST to `/api/suggestions/paragraph` with test paragraph
  - [ ] Verify response structure: `{ type, title, rationale, confidence }` or `{ suggestion: null }`
  - [ ] Verify rate limiting: send 31 requests in 1 minute, verify 31st returns 429

- [ ] E2E test for suggestion card flow (Playwright)
  - [ ] Navigate to journal page
  - [ ] Type paragraph: "I should update my resume"
  - [ ] Press Enter twice (trigger paragraph boundary)
  - [ ] Wait for suggestion card to appear
  - [ ] Verify card displays "Update resume" suggestion
  - [ ] Click "Add" button
  - [ ] Verify task created in database
  - [ ] Verify card dismissed

- [ ] Performance test
  - [ ] Lighthouse CI test: verify performance score ≥90 on journal page
  - [ ] Custom profiling: type 100 characters, verify P95 typing latency < 16ms
  - [ ] API latency test: measure 20 suggestion API calls, verify P95 < 200ms

### Task 8: Verify Existing Functionality

- [ ] Test journal entry saving
  - [ ] Type paragraph with suggestion card appearing
  - [ ] Blur editor (trigger save)
  - [ ] Verify entry saved to database correctly
  - [ ] Verify suggestion generation didn't block save

- [ ] Test formatting toolbar
  - [ ] Select text, click Bold button
  - [ ] Verify text becomes bold
  - [ ] Verify paragraph detection didn't interfere

- [ ] Test "Make Note" popup
  - [ ] Select text, verify popup appears
  - [ ] Create note from selection
  - [ ] Verify note created correctly
  - [ ] Verify no conflicts with suggestion card

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Paragraph detection interferes with typing experience (lag or cursor jumps)
- **Mitigation:**
  - Use 1200ms debounce (only trigger after user stops typing)
  - Run suggestion API call asynchronously (non-blocking)
  - Use `requestIdleCallback` for heavy processing
  - Lazy load SuggestionCard component (code splitting)
- **Verification:**
  - Custom profiling logger tracks typing latency
  - Manual testing: rapid typing, verify no lag

**Secondary Risk:** Suggestion API latency exceeds 200ms, causing poor UX
- **Mitigation:**
  - Cache-first strategy for embeddings (most requests hit cache)
  - Fallback to keyword-only scoring on cache miss (faster)
  - Server-side rate limiting prevents abuse
- **Verification:**
  - API latency tracking in Vercel Logs
  - Load test with 20 concurrent users

**Tertiary Risk:** Suggestion quality is poor, users dismiss 80%+ of suggestions
- **Mitigation:**
  - Confidence threshold ≥ 0.5 filters low-quality suggestions
  - Track acceptance rate, tune scoring algorithm if <20%
  - "Later" button provides easy dismissal (no frustration)
- **Verification:**
  - Analytics dashboard shows acceptance rate
  - User feedback collection

### Rollback Plan

If suggestion feature causes issues:
1. Feature flag: set `ENABLE_SUGGESTIONS=false` in Vercel env vars
2. Conditional rendering: `if (process.env.ENABLE_SUGGESTIONS) { ... }`
3. Redeploy with flag disabled
4. Debug locally, fix, re-enable

### Safety Checks

- [ ] Existing journal entry creation works
- [ ] Typing feels responsive (no lag)
- [ ] SuggestionCard doesn't block editor interaction
- [ ] Rate limiting prevents API abuse

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC8)
- [ ] All tasks completed (task-only MVP scope)
- [ ] Paragraph detection works without typing lag
- [ ] Suggestion API returns task suggestions (person/link deferred)
- [ ] SuggestionCard UI matches Notebook theme
- [ ] "Add" button creates tasks correctly
- [ ] Unit tests pass (Vitest) - task suggestions only
- [ ] E2E tests pass (Playwright)
- [ ] Performance tests pass (Lighthouse ≥90, typing latency < 16ms)
- [ ] Existing functionality verified (save, format, make note)
- [ ] Code follows existing patterns
- [ ] TypeScript types defined
- [ ] PR created targeting `dev` branch
- [ ] Vercel preview deployment tested
- [ ] Acceptance rate tracking implemented (≥25% target before adding person/link suggestions)

---

## Future Enhancements (Deferred to Phase 2)

**Prerequisites:** Task suggestion acceptance rate ≥ 25% validated in production

### Phase 2 Additions:
1. **Person Suggestions:**
   - Detect person entity mentions
   - Suggest follow-up reminders ("Reach out to X tomorrow")
   - Integrate with Story 1.2's date parser for natural language dates

2. **Link Suggestions:**
   - Add PGVector embedding similarity scoring
   - Suggest note connections based on semantic similarity
   - Reuse existing bidirectional link creation from Story 2.4.2

3. **Embedding-Based Scoring:**
   - Enable `paragraph_embeddings` table usage
   - Add cosine similarity scoring
   - Implement cache-first strategy with OpenAI Embeddings API

4. **Suggestion Calibration & Controls:**
   - User settings for suggestion frequency
   - Opt-out/quiet mode toggle
   - Feedback collection (thumbs up/down on suggestions)
   - A/B test confidence thresholds (0.3, 0.5, 0.7)

### Recommended Follow-Up Stories:
- **Story 1.7:** Onboarding & Empty States (first-time explainer, starter prompts)
- **Story 1.8:** Keyword Click-to-Filter (make Keywords section actionable before advanced viz)
- **Story 1.9:** Suggestion Calibration & User Controls (frequency settings, disable toggles)

---

## File Checklist

**Modify:**
- [ ] `/src/components/editor/SimpleRichEditor.tsx`

**Create:**
- [ ] `/src/components/intelligence/SuggestionCard.tsx`
- [ ] `/src/app/api/suggestions/paragraph/route.ts`
- [ ] `/src/utils/nlp/scoring.ts`
- [ ] `/src/utils/profiling.ts`
- [ ] `/src/utils/nlp/scoring.test.ts` (Vitest)
- [ ] `/tests/e2e/suggestion-card.spec.ts` (Playwright)

**Optional:**
- [ ] Database migration for `suggestion_logs` table (if analytics tracking desired)
