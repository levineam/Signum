# Story 1.2: Natural Language Task/Reminder Parsing

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: ✅ Completed (PR #65, merged Oct 24, 2025)

## Story

As a **journaling user**,
I want **to write "remind me in 10 days to call Mom" in my journal and have it automatically create a reminder**,
so that **I can capture tasks naturally without leaving my writing flow**.

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Natural language processing for task extraction
- **Existing System Impact:** Adds new API routes, creates tasks from journal text
- **Dependencies:** Story 1.1 (tasks table, NLP utilities)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** Date parser utility functional
- Date parsing function in `/src/utils/nlp/dateParser.ts`
- Supports relative dates: "in 10 days", "tomorrow", "next week", "in 3 hours"
- Supports absolute dates: "next Fri 8a", "Oct 25", "2025-11-01", "December 1st"
- Supports recurring dates: "every Mon", "daily", "every 2 weeks", "first Monday of month"
- Returns `{ dueAt: Date, rrule?: string }` or `null` if no date detected
- Uses lightweight library (chrono-node or similar)

**AC2:** Task detection in paragraphs working
- Task detection function in `/src/utils/nlp/taskDetection.ts`
- Identifies task keywords: "remind me", "todo", "task", "need to", "should", "must", "want to", "plan to", "have to"
- Extracts task title (text between keyword and date phrase, or entire phrase if no date)
- Calls date parser to extract due date
- Returns `{ title: string, dueAt: Date | null, rrule?: string }` or `null` if no task detected

**AC3:** Task creation API functional
- `POST /api/tasks/parse` endpoint created
- Accepts `{ paragraphText: string, userId: string, entryId: string }`
- Calls task detection utility
- Creates task record in `tasks` table with `source_entry_id` linking to journal entry
- Creates reminder record in `reminders` table if due date detected
- Returns created task: `{ id: string, title: string, dueAt: Date | null, rrule?: string }`

**AC4:** Inline task indication (optional MVP)
- After task created, highlight task text in journal editor (subtle background color)
- Add `data-task-id` attribute to task span (similar to existing link implementation)
- Clicking task text opens task detail popover (defer full UI to Story 1.4)

**AC5:** Unit test coverage complete
- Test date parser with 20+ date format variations
- Test task detection with various sentence structures
- Test edge cases: no date, multiple dates, ambiguous phrasing

### Integration Requirements

**AC6:** Existing "Make Note" flow unaffected
- Users can still create notes from text highlights
- Task creation happens asynchronously, doesn't interfere

**AC7:** Journal entry saving still works
- Task creation doesn't block journal entry save
- Tasks linked to correct entry via `source_entry_id`

**AC8:** No errors in browser console
- Graceful handling of unparseable dates
- No crashes on malformed input

---

## Dev Technical Guidance

### Existing System Context

**Tasks Table (from Story 1.1):**
- Columns: `id`, `user_id`, `title`, `status`, `due_at`, `remind_at`, `rrule`, `metadata`, `source_entry_id`, etc.
- FK: `source_entry_id → notes(id)` where `note_type = 'journal-entry'`

**Journal Editor:**
- Location: `/src/components/editor/SimpleRichEditor.tsx`
- Already has paragraph detection (Story 1.2)
- Uses contentEditable with custom formatting

### Integration Approach

**Task Detection Flow:**
1. User types paragraph: "I need to call Mom tomorrow at 3pm"
2. Paragraph boundary detected (Story 1.2 logic)
3. In addition to suggestion card, check for task keywords
4. If task detected: call `POST /api/tasks/parse` with paragraph text
5. API creates task in database, returns task ID
6. Editor adds highlight to task text (optional)

**Date Parsing Strategy:**
- Use `chrono-node` library (lightweight, supports many formats)
- Normalize date to user's timezone (get from Supabase user metadata or browser)
- For recurring tasks: generate RRULE string per RFC 5545
- Store both `due_at` (next occurrence) and `rrule` (recurrence rule)

**Task Title Extraction:**
- Pattern 1: "remind me to [TITLE] [DATE]" → title = [TITLE]
- Pattern 2: "I need to [TITLE] [DATE]" → title = [TITLE]
- Pattern 3: "todo: [TITLE]" → title = [TITLE]
- Pattern 4: "[TITLE]" (no keyword, but date present) → title = [TITLE]

### Technical Constraints

**Performance:**
- Date parsing must complete in < 50ms for 100-word paragraph
- Task detection must complete in < 30ms

**Accuracy:**
- Accept 80%+ of common date formats (relative, absolute, recurring)
- Gracefully handle ambiguous dates (e.g., "May" could be month or modal verb)

**RRULE Compliance:**
- Use RFC 5545 format for recurring tasks
- Example: "every Monday" → `FREQ=WEEKLY;BYDAY=MO`
- Example: "daily" → `FREQ=DAILY`

### File Locations

Create:
- `/src/utils/nlp/dateParser.ts` (date parsing utility)
- `/src/utils/nlp/taskDetection.ts` (task detection utility)
- `/src/app/api/tasks/parse/route.ts` (API endpoint)

Modify:
- `/src/components/editor/SimpleRichEditor.tsx` (add task highlighting, optional)

---

## Tasks / Subtasks

### Task 1: Date Parser Utility

- [ ] Install chrono-node library
  - [ ] Run: `npm install chrono-node`
  - [ ] Add types: `npm install -D @types/chrono-node`

- [ ] Implement date parser `/src/utils/nlp/dateParser.ts`
  - [ ] Import chrono: `import * as chrono from 'chrono-node'`
  - [ ] Function signature: `parseDate(text: string): { dueAt: Date, rrule?: string } | null`
  - [ ] Call chrono: `const results = chrono.parse(text)`
  - [ ] If no results: return null

- [ ] Handle relative dates
  - [ ] "tomorrow" → add 1 day to current date
  - [ ] "in 10 days" → add 10 days
  - [ ] "next week" → add 7 days
  - [ ] "in 3 hours" → add 3 hours

- [ ] Handle absolute dates
  - [ ] "Oct 25" → parse to Date object
  - [ ] "next Fri 8a" → find next Friday, set time to 8am
  - [ ] "2025-11-01" → parse ISO date
  - [ ] "December 1st" → parse month and day, use current year if not specified

- [ ] Handle recurring dates
  - [ ] Detect keywords: "every", "daily", "weekly", "monthly"
  - [ ] "every Mon" → `rrule = 'FREQ=WEEKLY;BYDAY=MO'`, dueAt = next Monday
  - [ ] "daily" → `rrule = 'FREQ=DAILY'`, dueAt = tomorrow
  - [ ] "every 2 weeks" → `rrule = 'FREQ=WEEKLY;INTERVAL=2'`, dueAt = 2 weeks from now
  - [ ] "first Monday of month" → `rrule = 'FREQ=MONTHLY;BYDAY=1MO'`, dueAt = first Monday of next month

- [ ] Return parsed result
  - [ ] `return { dueAt: results[0].start.date(), rrule: generatedRRule || undefined }`
  - [ ] If multiple dates found: use first one
  - [ ] Normalize to user's timezone (default to UTC for MVP)

### Task 2: Task Detection Utility

- [ ] Implement task detection `/src/utils/nlp/taskDetection.ts`
  - [ ] Function signature: `detectTask(paragraphText: string): { title: string, dueAt: Date | null, rrule?: string } | null`
  - [ ] Define task keywords array: `['remind me', 'todo', 'task', 'need to', 'should', 'must', 'want to', 'plan to', 'have to']`

- [ ] Check for task keywords
  - [ ] Lowercase paragraph text
  - [ ] Loop through keywords: `if (text.includes(keyword)) { ... }`
  - [ ] If no keyword found: return null

- [ ] Extract task title
  - [ ] Pattern matching:
    - "remind me to [TITLE]" → capture group after "to"
    - "I need to [TITLE]" → capture group after "need to"
    - "todo: [TITLE]" → capture group after ":"
  - [ ] Use regex: `/(?:remind me to|need to|should|must|want to|plan to|have to)\s+(.+?)(?:\s+(?:tomorrow|in \d+|next|on|at|every|daily)|\.|$)/i`
  - [ ] Extract title from capture group

- [ ] Parse date from paragraph
  - [ ] Call `parseDate(paragraphText)`
  - [ ] If date found: use it
  - [ ] If no date: set `dueAt = null`

- [ ] Return task object
  - [ ] `return { title: extractedTitle.trim(), dueAt: parsedDate?.dueAt || null, rrule: parsedDate?.rrule }`
  - [ ] If title is empty or < 3 chars: return null

### Task 3: Task Creation API Route

- [ ] Create API route `/api/tasks/parse/route.ts`
  - [ ] Export POST handler: `export async function POST(req: Request)`
  - [ ] Parse request body: `const { paragraphText, userId, entryId } = await req.json()`
  - [ ] Validate inputs: paragraphText (1-1000 chars), userId (UUID), entryId (UUID)

- [ ] Authenticate user
  - [ ] Get user from Supabase auth using Next.js App Router pattern:
    ```ts
    import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
    import { cookies } from 'next/headers'

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || user.id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    ```

- [ ] Detect task
  - [ ] Call `detectTask(paragraphText)`
  - [ ] If null: return `{ task: null }` (no task detected)

- [ ] Create task in database
  - [ ] Use `createTask()` from Story 1.1: `/src/lib/db/tasks.ts`
  - [ ] Parameters: `userId, title, dueAt, { source_entry_id: entryId }`
  - [ ] Store in `tasks` table

- [ ] Create reminder if due date exists
  - [ ] If `dueAt` is not null:
    - Insert into `reminders` table: `{ user_id: userId, task_id: task.id, rule_type: rrule ? 'rrule' : 'oneoff', rrule: rrule || null }`
  - [ ] Use Supabase insert: `await supabase.from('reminders').insert({ ... })`

- [ ] Return response
  - [ ] `return NextResponse.json({ task: { id: task.id, title: task.title, dueAt: task.due_at, rrule: task.rrule } })`
  - [ ] Status 200

### Task 4: Inline Task Highlighting (Optional)

- [ ] Modify SimpleRichEditor to highlight tasks
  - [ ] After task created via API, receive task ID in response
  - [ ] Find task text in editor content (search for task title)
  - [ ] Wrap in `<span data-task-id="${taskId}" class="task-highlight">`

- [ ] Style task highlight
  - [ ] Add CSS: `.task-highlight { background-color: rgba(59, 130, 246, 0.1); border-bottom: 1px dashed rgba(59, 130, 246, 0.5); }`
  - [ ] Subtle, non-intrusive (matches existing link style)

- [ ] Handle task click (defer full UI)
  - [ ] Add `onClick` handler to task span
  - [ ] For MVP: show simple tooltip with task details
  - [ ] Full task detail popover deferred to Story 1.4

### Task 5: Testing

- [ ] Unit tests for date parser (Vitest)
  - [ ] Test relative: "tomorrow", "in 5 days", "next week"
  - [ ] Test absolute: "Oct 25", "next Fri 8a", "2025-11-01"
  - [ ] Test recurring: "every Mon", "daily", "every 2 weeks"
  - [ ] Test edge cases: "May" (ambiguous), "yesterday" (past date), "asap" (no date)
  - [ ] Verify 20+ date formats

- [ ] Unit tests for task detection (Vitest)
  - [ ] Test: "I need to call Mom tomorrow" → { title: "call Mom", dueAt: tomorrow }
  - [ ] Test: "Remind me to update resume in 10 days" → { title: "update resume", dueAt: in 10 days }
  - [ ] Test: "Todo: finish the project" → { title: "finish the project", dueAt: null }
  - [ ] Test: "I love coding" (no task) → null
  - [ ] Test: Multiple tasks in one paragraph → detect first task only

- [ ] Integration test for API route (Playwright)
  - [ ] POST to `/api/tasks/parse` with "I should call Sarah next Friday"
  - [ ] Verify response: `{ task: { id, title: "call Sarah", dueAt: <next Friday>, rrule: null } }`
  - [ ] Verify task created in database
  - [ ] Verify reminder created in database

- [ ] E2E test for task creation flow (Playwright)
  - [ ] Navigate to journal page
  - [ ] Type: "I need to finish the report by tomorrow"
  - [ ] Press Enter twice (trigger paragraph)
  - [ ] Wait for task to be created
  - [ ] Verify task appears in database with correct title and due date

### Task 6: Verify Existing Functionality

- [ ] Test "Make Note" popup still works
  - [ ] Select text in journal editor
  - [ ] Verify "Make Note" popup appears
  - [ ] Create note, verify it saves
  - [ ] No conflicts with task creation

- [ ] Test journal entry saving
  - [ ] Write paragraph with task: "Todo: review PR #42"
  - [ ] Save entry
  - [ ] Verify entry saved to `notes` table
  - [ ] Verify task saved to `tasks` table with correct `source_entry_id`

- [ ] Test suggestion card (Story 1.2) still works
  - [ ] Write paragraph triggering suggestion
  - [ ] Verify suggestion card appears
  - [ ] Task creation doesn't interfere with suggestions

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Date parser misinterprets dates (e.g., "May" as month vs. modal verb)
- **Mitigation:**
  - Confidence threshold: only parse if chrono confidence > 0.7
  - Context-aware parsing: check for surrounding date keywords
  - Fallback: if ambiguous, don't create task (user can specify manually)
- **Verification:**
  - Unit tests for ambiguous cases
  - User feedback: track task creation accuracy

**Secondary Risk:** Task keyword matching is too aggressive (creates tasks when not intended)
- **Mitigation:**
  - Require explicit keywords ("remind me", "todo", "need to", etc.)
  - Don't create task for generic "should" statements without action verb
  - Example: "I should be happy" → no task (no action), "I should call Mom" → task (action)
- **Verification:**
  - Unit tests for false positives
  - Analytics: track task creation rate (should be < 20% of paragraphs)

**Tertiary Risk:** RRULE format errors cause reminder failures
- **Mitigation:**
  - Use standard library for RRULE generation (rrule.js if needed)
  - Validate RRULE format before saving
  - Test recurring reminders in dev environment
- **Verification:**
  - Unit tests for RRULE generation
  - Manual test: create recurring task, verify it recurs correctly (defer to Story 1.4)

### Rollback Plan

If task parsing causes issues:
1. Feature flag: `ENABLE_TASK_PARSING=false`
2. Conditional: `if (process.env.ENABLE_TASK_PARSING) { callTaskParseAPI() }`
3. Redeploy with flag disabled
4. Debug and fix

### Safety Checks

- [ ] Task creation doesn't block journal entry save
- [ ] No errors on unparseable dates
- [ ] Task highlighting doesn't break editor formatting
- [ ] Existing "Make Note" flow works

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC8)
- [ ] All tasks completed
- [ ] Date parser handles 20+ date formats
- [ ] Task detection works for common task phrases
- [ ] Task creation API functional
- [ ] Tasks stored in database with correct metadata
- [ ] Reminders created for tasks with due dates
- [ ] Unit tests pass (20+ date formats, 10+ task patterns)
- [ ] Integration tests pass
- [ ] E2E test passes
- [ ] Existing functionality verified
- [ ] Code follows existing patterns
- [ ] TypeScript types defined
- [ ] PR created targeting `dev` branch
- [ ] Vercel preview deployment tested

---

## File Checklist

**Create:**
- [ ] `/src/utils/nlp/dateParser.ts`
- [ ] `/src/utils/nlp/taskDetection.ts`
- [ ] `/src/app/api/tasks/parse/route.ts`
- [ ] `/src/utils/nlp/dateParser.test.ts` (Vitest)
- [ ] `/src/utils/nlp/taskDetection.test.ts` (Vitest)
- [ ] `/tests/e2e/task-creation.spec.ts` (Playwright)

**Modify (optional):**
- [ ] `/src/components/editor/SimpleRichEditor.tsx` (task highlighting)

**Dependencies:**
- [ ] Add `chrono-node` to package.json
