# Story 1.4: Today Header & Task Management UI

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: Draft

## Story

As a **journaling user**,
I want **to see my due tasks at the top of today's journal entry when I open the app**,
so that **I'm reminded of commitments without leaving my journaling context**.

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Task management UI overlay for journal
- **Existing System Impact:** Adds component to journal stream page
- **Dependencies:** Story 1.1 (tasks table), Story 1.3 (task creation)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** Today Header component displays correctly
- `TodayHeader.tsx` component created in `/src/components/intelligence/`
- Displays at top of journal stream page (above today's entry)
- Shows 4 sections: Due Today (max 5 tasks), Overdue (1 task), Upcoming (1 task), C3 Suggestion (1 item - placeholder for Story 1.6)
- Each task card shows: title, due time (if specified), two buttons (Done/Snooze)
- Styled with shadcn/ui Card, matches Notebook theme

**AC2:** Today Header data API functional
- `GET /api/tasks/today` endpoint created
- Accepts `userId` from auth session
- Queries `tasks` table for:
  - Due today: `due_at >= today 00:00 AND due_at < tomorrow 00:00 AND status != 'completed'` (limit 5, ordered by due_at ASC)
  - Overdue: `due_at < today 00:00 AND status != 'completed'` (limit 1, oldest first)
  - Upcoming: `due_at >= tomorrow 00:00 AND due_at < tomorrow + 7 days AND status != 'completed'` (limit 1, soonest first)
- Returns `{ dueToday: Task[], overdue: Task[], upcoming: Task[] }`
- Achieves < 300ms P95 latency

**AC3:** Task actions functional
- "Done" button calls `PATCH /api/tasks/:id` with `{ status: 'completed', completedAt: now() }`
- "Snooze" button shows inline date picker (1 day, 3 days, 1 week, custom)
- Snoozing calls `PATCH /api/tasks/:id` with `{ dueAt: newDate, snoozeCount: snoozeCount + 1 }`
- Snooze updates `metadata.snoozes` array with `{ date: oldDueAt, snoozedTo: newDueAt, reason: 'user' }`
- UI updates optimistically (immediate feedback), rolls back on error

**AC4:** Rollover logic implemented
- Nightly cron job (Vercel Cron) OR first-open trigger moves unfinished tasks
- Unfinished tasks from yesterday get audit note in metadata: `metadata.rollovers.push({ date: yesterday, reason: 'not completed' })`
- Tasks remain in "pending" status, `due_at` unchanged
- Rollover only happens once per day (track in `meters_daily` or localStorage)

**AC5:** Real-time updates enabled
- Use Supabase Realtime subscription on `tasks` table
- When task marked done by user, Today Header updates immediately (no page refresh)
- Subscription filters: `user_id = current_user AND status IN ('pending', 'completed') AND due_at >= today - 1 day`

**AC6:** Empty state displayed
- If no due tasks, show encouraging message: "No tasks due today. Enjoy your journaling!"
- Show placeholder for C3 suggestion (Story 1.6) or starter prompt

### Integration Requirements

**AC7:** Journal entry creation flow unaffected
- Users can still write journal entries with Today Header present
- Header doesn't block editor input

**AC8:** Page load performance acceptable
- Today Header adds < 300ms to initial page render
- Lazy load component if needed

**AC9:** Existing journal stream scroll behavior maintained
- Header doesn't interfere with scrolling to past entries
- Header sticky/fixed position (user preference TBD)

---

## Dev Technical Guidance

### Existing System Context

**Journal Stream Page:**
- Location: `/src/app/page.tsx`
- Displays journal entries in reverse chronological order
- Uses `JournalStream` component: `/src/components/journal/JournalStream.tsx`

**Tasks Table:**
- From Story 1.1, columns: `id`, `user_id`, `title`, `status`, `due_at`, `metadata`, `snooze_count`, etc.
- Status values: 'pending', 'completed', 'cancelled'

### Integration Approach

**Component Placement:**
1. Modify `/src/app/page.tsx` to include `<TodayHeader />` above `<JournalStream />`
2. TodayHeader fetches data via `GET /api/tasks/today`
3. Renders task cards with Done/Snooze buttons
4. Updates tasks via `PATCH /api/tasks/:id`

**Rollover Strategy:**
- **Option A (Vercel Cron):** Create `/api/cron/rollover` endpoint, configure in `vercel.json`
- **Option B (First-open):** Check localStorage `lastRolloverDate`, run rollover if date < today
- **Recommended:** Option B for MVP (simpler, no Vercel Cron config)

**Real-time Updates:**
- Use Supabase Realtime: `supabase.channel('tasks').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: 'user_id=eq.XXX' }, handleUpdate)`
- Update local state when task status changes
- Revalidate Today Header data

### Technical Constraints

**Performance:**
- Today Header load time < 300ms P95
- Real-time updates < 100ms latency

**UX:**
- Snooze picker must be keyboard accessible
- Done action must have optimistic UI (no loading spinner)

**Data Consistency:**
- Rollover logic must not duplicate rollover entries (check if already rolled over today)

### File Locations

Create:
- `/src/components/intelligence/TodayHeader.tsx` (main component)
- `/src/components/intelligence/TaskCard.tsx` (individual task card)
- `/src/app/api/tasks/today/route.ts` (Today Header data API)
- `/src/app/api/tasks/[id]/route.ts` (PATCH endpoint for task updates)
- `/src/utils/rollover.ts` (rollover logic, if using first-open strategy)

Modify:
- `/src/app/page.tsx` (add TodayHeader component)

---

## Tasks / Subtasks

### Task 1: Today Header Data API

- [ ] Create API route `/api/tasks/today/route.ts`
  - [ ] Export GET handler
  - [ ] Get user from auth: `const user = await req.auth()`
  - [ ] Get today's date: `const today = new Date(); today.setHours(0,0,0,0)`
  - [ ] Get tomorrow: `const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)`

- [ ] Query due today tasks
  - [ ] Supabase query: `SELECT * FROM tasks WHERE user_id = user.id AND due_at >= today AND due_at < tomorrow AND status != 'completed' ORDER BY due_at ASC LIMIT 5`
  - [ ] Use `getTasksDueToday()` from Story 1.1 if available

- [ ] Query overdue tasks
  - [ ] Supabase query: `SELECT * FROM tasks WHERE user_id = user.id AND due_at < today AND status != 'completed' ORDER BY due_at ASC LIMIT 1`
  - [ ] Use `getTasksOverdue()` from Story 1.1 if available

- [ ] Query upcoming tasks
  - [ ] Supabase query: `SELECT * FROM tasks WHERE user_id = user.id AND due_at >= tomorrow AND due_at < tomorrow + 7 days AND status != 'completed' ORDER BY due_at ASC LIMIT 1`
  - [ ] Use `getTasksUpcoming(7)` from Story 1.1 if available

- [ ] Return response
  - [ ] `return NextResponse.json({ dueToday, overdue, upcoming })`
  - [ ] Cache for 60 seconds (use `revalidate: 60` in Next.js fetch)

### Task 2: Task Update API

- [ ] Create API route `/api/tasks/[id]/route.ts`
  - [ ] Export PATCH handler
  - [ ] Get task ID from params: `const { id } = params`
  - [ ] Parse body: `const { status, dueAt, snoozeCount, metadata } = await req.json()`
  - [ ] Authenticate user

- [ ] Update task in database
  - [ ] If `status = 'completed'`: set `completed_at = now()`
  - [ ] If `dueAt` changed (snooze): update `due_at`, increment `snooze_count`
  - [ ] If snooze: append to `metadata.snoozes` array: `{ date: oldDueAt, snoozedTo: newDueAt, reason: 'user', timestamp: now() }`
  - [ ] Use `markTaskComplete()` or `snoozeTask()` from Story 1.1

- [ ] Return updated task
  - [ ] `return NextResponse.json({ task: updatedTask })`

### Task 3: TodayHeader Component

- [ ] Create TodayHeader component `/src/components/intelligence/TodayHeader.tsx`
  - [ ] Fetch data: `const { dueToday, overdue, upcoming } = await fetch('/api/tasks/today').then(r => r.json())`
  - [ ] Use SWR for caching: `const { data, mutate } = useSWR('/api/tasks/today', fetcher, { refreshInterval: 60000 })`

- [ ] Render sections
  - [ ] Section 1: "Due Today" (max 5 tasks)
  - [ ] Section 2: "Overdue" (1 task, highlighted in red/orange)
  - [ ] Section 3: "Upcoming" (1 task, muted color)
  - [ ] Section 4: "C3 Suggestion" (placeholder for Story 1.6, show "Coming soon")

- [ ] Handle empty state
  - [ ] If `dueToday.length === 0 && overdue.length === 0`: show "No tasks due today. Enjoy your journaling!"
  - [ ] Optionally show starter prompt or motivational message

- [ ] Style with shadcn/ui
  - [ ] Use Card component for each section
  - [ ] Match Notebook theme (cream background, serif typography)
  - [ ] Responsive layout (stack on mobile)

### Task 4: TaskCard Component

- [ ] Create TaskCard component `/src/components/intelligence/TaskCard.tsx`
  - [ ] Props: `{ task: Task, onDone: (taskId) => void, onSnooze: (taskId, newDueAt) => void }`
  - [ ] Display task title (bold)
  - [ ] Display due time if specified (e.g., "3:00 PM")
  - [ ] Two buttons: "Done" (checkmark icon), "Snooze" (clock icon)

- [ ] "Done" button handler
  - [ ] Optimistic update: immediately hide task from UI
  - [ ] Call API: `PATCH /api/tasks/${task.id}` with `{ status: 'completed', completedAt: new Date() }`
  - [ ] On success: mutate SWR cache, remove task from list
  - [ ] On error: revert UI, show error toast

- [ ] "Snooze" button handler
  - [ ] Show inline date picker (use shadcn/ui Popover + Calendar)
  - [ ] Quick options: "1 day", "3 days", "1 week", "Custom"
  - [ ] On select: call API with new due date
  - [ ] Optimistic update: move task to "Upcoming" section

- [ ] Style task card
  - [ ] Compact card (80px height)
  - [ ] Hover effect (subtle shadow)
  - [ ] Completed tasks fade out with animation

### Task 5: Rollover Logic

- [ ] Implement rollover utility `/src/utils/rollover.ts`
  - [ ] Function: `async function rolloverTasks(userId: string): Promise<void>`
  - [ ] Check if rollover already done today:
    - [ ] Check localStorage: `const lastRollover = localStorage.getItem('lastRolloverDate')`
    - [ ] If `lastRollover === today`: return early
  - [ ] Query tasks: `SELECT * FROM tasks WHERE user_id = userId AND due_at < today AND status = 'pending'`
  - [ ] For each task:
    - [ ] Append to `metadata.rollovers`: `{ date: task.due_at, reason: 'not completed', timestamp: now() }`
    - [ ] Update task: `PATCH /api/tasks/${task.id}` with updated metadata
  - [ ] Set localStorage: `localStorage.setItem('lastRolloverDate', today)`

- [ ] Call rollover on page load
  - [ ] In `/src/app/page.tsx` or TodayHeader component
  - [ ] `useEffect(() => { rolloverTasks(user.id) }, [user.id])`
  - [ ] Only runs once per day per user

### Task 6: Real-time Updates

- [ ] Add Supabase Realtime subscription to TodayHeader
  - [ ] Create channel: `const channel = supabase.channel('tasks-realtime')`
  - [ ] Subscribe to changes: `channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, handleTaskUpdate)`
  - [ ] Handle update: `function handleTaskUpdate(payload) { mutate() }` (revalidate SWR cache)
  - [ ] Cleanup: `useEffect(() => { return () => channel.unsubscribe() }, [])`

- [ ] Test real-time updates
  - [ ] Mark task as done in one tab
  - [ ] Verify Today Header updates in another tab within 1 second

### Task 7: Integration with Journal Page

- [ ] Modify `/src/app/page.tsx`
  - [ ] Import TodayHeader: `import TodayHeader from '@/components/intelligence/TodayHeader'`
  - [ ] Add above JournalStream: `<TodayHeader /> <JournalStream />`
  - [ ] Lazy load component: `const TodayHeader = dynamic(() => import('@/components/intelligence/TodayHeader'), { ssr: false })`

- [ ] Test placement
  - [ ] Verify header appears at top of page
  - [ ] Verify journal entries appear below
  - [ ] Verify scrolling works correctly

### Task 8: Testing

- [ ] Unit tests for rollover logic (Vitest)
  - [ ] Test: rollover runs once per day (localStorage check)
  - [ ] Test: unfinished tasks get rollover metadata appended
  - [ ] Test: completed tasks not rolled over

- [ ] Integration test for Today Header API (Playwright)
  - [ ] Create 3 test tasks: 1 due today, 1 overdue, 1 upcoming
  - [ ] GET `/api/tasks/today`
  - [ ] Verify response contains correct tasks in correct sections

- [ ] E2E test for task completion (Playwright)
  - [ ] Navigate to journal page
  - [ ] Verify Today Header displays with task
  - [ ] Click "Done" button
  - [ ] Verify task disappears from header
  - [ ] Verify task status updated in database

- [ ] E2E test for task snooze (Playwright)
  - [ ] Click "Snooze" button
  - [ ] Select "3 days" from picker
  - [ ] Verify task moves to "Upcoming" section
  - [ ] Verify `snooze_count` incremented in database

### Task 9: Verify Existing Functionality

- [ ] Test journal entry creation
  - [ ] With Today Header present, create new journal entry
  - [ ] Verify entry saves correctly
  - [ ] Verify header doesn't interfere

- [ ] Test journal stream scrolling
  - [ ] Scroll through past journal entries
  - [ ] Verify Today Header doesn't block scroll (or stays fixed at top)
  - [ ] Verify smooth scrolling experience

- [ ] Test page load performance
  - [ ] Measure time to first render with Today Header
  - [ ] Verify < 300ms added latency
  - [ ] Lighthouse test: performance score ≥90

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Rollover logic runs multiple times per day, duplicating rollover entries
- **Mitigation:**
  - localStorage check before rollover
  - Idempotent rollover (check if today's date already in metadata.rollovers)
  - Atomic update (use Supabase upsert pattern)
- **Verification:**
  - Unit test: run rollover twice, verify only one entry added
  - Manual test: refresh page multiple times, check metadata

**Secondary Risk:** Real-time updates cause race conditions (optimistic UI vs. server state)
- **Mitigation:**
  - Optimistic updates only for user actions (Done/Snooze)
  - Realtime updates for other users/devices (passive)
  - SWR handles cache invalidation automatically
- **Verification:**
  - Test with 2 devices: mark done on device A, verify update on device B

**Tertiary Risk:** Today Header load time exceeds 300ms, slowing page render
- **Mitigation:**
  - Lazy load component (don't block initial render)
  - Cache API response (SWR with 60s revalidation)
  - Database query optimization (use indexes from Story 1.1)
- **Verification:**
  - Performance profiling: measure Today Header render time
  - Load test: 100 concurrent users, verify P95 < 300ms

### Rollback Plan

If Today Header causes issues:
1. Feature flag: `ENABLE_TODAY_HEADER=false`
2. Conditional render: `{process.env.ENABLE_TODAY_HEADER && <TodayHeader />}`
3. Redeploy with flag disabled

### Safety Checks

- [ ] Journal entry creation works
- [ ] Scrolling works
- [ ] Page load time acceptable
- [ ] No memory leaks from Realtime subscription

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC9)
- [ ] All tasks completed
- [ ] Today Header displays correctly
- [ ] Due/Overdue/Upcoming tasks shown
- [ ] Done/Snooze actions work
- [ ] Rollover logic functional
- [ ] Real-time updates working
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Existing functionality verified
- [ ] Code follows existing patterns
- [ ] TypeScript types defined
- [ ] PR created targeting `dev` branch
- [ ] Vercel preview deployment tested

---

## File Checklist

**Create:**
- [ ] `/src/components/intelligence/TodayHeader.tsx`
- [ ] `/src/components/intelligence/TaskCard.tsx`
- [ ] `/src/app/api/tasks/today/route.ts`
- [ ] `/src/app/api/tasks/[id]/route.ts`
- [ ] `/src/utils/rollover.ts`
- [ ] `/src/utils/rollover.test.ts` (Vitest)
- [ ] `/tests/e2e/today-header.spec.ts` (Playwright)

**Modify:**
- [ ] `/src/app/page.tsx` (add TodayHeader)
