# Story 1.5: Weekly Snapshot & Rising Themes Analytics

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: Draft

## Story

As a **journaling user**,
I want **to see a weekly summary of what I accomplished, what slipped, and what themes are rising**,
so that **I gain insight into my patterns and priorities without manual review**.

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Weekly analytics and temporal insights
- **Existing System Impact:** Adds modal/page component, new API routes
- **Dependencies:** Story 1.1 (term_frequencies table), Story 1.4 (tasks with completion data)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** Weekly Snapshot component displays correctly
- `WeeklySnapshot.tsx` component created in `/src/components/intelligence/`
- Displays modal/page on first open each Monday (detected via localStorage `lastWeeklySnapshotSeen` timestamp)
- 4 sections: Done (completed tasks grouped by project/person), Slipped (tasks moved ≥2 times or >7 days late), Focus Next Week (one active project with rising centrality), Rising Themes (top Δ term counts vs prior week)
- Styled with shadcn/ui Dialog/Modal, matches Notebook theme

**AC2:** Weekly analytics API functional
- `GET /api/analytics/weekly` endpoint created
- Accepts `userId`, optional `weekStartDate` (defaults to last Monday)
- Returns `{ done: Task[], slipped: Task[], risingThemes: Term[], focusProject: Entity | null }`
- Queries:
  - Done: `tasks WHERE status = 'completed' AND completed_at >= weekStart AND completed_at < weekEnd`
  - Slipped: `tasks WHERE snooze_count >= 2 OR (due_at < now - 7 days AND status != 'completed')`
  - Rising themes: `term_frequencies` → calculate `delta = count_this_week - count_last_week` → top 5 by delta
  - Focus project: `entities WHERE type = 'project'` → order by centrality DESC → top 1
- Achieves < 5 seconds for users with 1000+ entries

**AC3:** Weekly rollover job functional
- Cron job (Vercel Cron) OR scheduled Edge Function runs every Monday 00:00
- For all `term_frequencies` records:
  - Copy `count_this_week` → `count_last_week`
  - Reset `count_this_week` to 0
- Log rollover in audit table (optional: `weekly_rollover_log` with `user_id`, `rollover_date`, `terms_updated`)

**AC4:** Markdown export functional
- "Export to Markdown" button on Weekly Snapshot modal
- Generates markdown summary with sections: Done, Slipped, Focus, Rising Themes
- Copies to clipboard AND/OR downloads as `.md` file
- Format matches example in PRD (headings, bullet lists, emojis)

**AC5:** First-open detection functional
- Check localStorage `lastWeeklySnapshotSeen` timestamp
- If last seen < last Monday 00:00, show modal
- Update timestamp after user dismisses modal
- Allow user to manually trigger snapshot (button on Ontology page or settings)

### Integration Requirements

**AC6:** Existing journal/notes pages unaffected
- Modal only appears once per week, can be dismissed
- No blocking UI

**AC7:** Performance acceptable
- Analytics query completes in < 5 seconds for 1000+ entries
- Modal render time < 1 second

**AC8:** No conflicts with existing Ontology page
- Both can coexist without data corruption
- Term frequencies used by both Rising Themes (Story 1.5) and Keywords (Story 1.6)

---

## Dev Technical Guidance

### Existing System Context

**Term Frequencies Table (from Story 1.1):**
- Columns: `user_id`, `term`, `count_alltime`, `count_this_week`, `count_last_week`
- Weekly rollover: copy `count_this_week` → `count_last_week`, reset `count_this_week` to 0

**Tasks Table:**
- Columns: `status`, `completed_at`, `snooze_count`, `due_at`, `metadata`
- Slipped task logic: `snooze_count >= 2` OR `due_at < now() - interval '7 days'`

**Entities Table:**
- Columns: `type`, `name`, `centrality`
- Projects: `type = 'project'`

### Integration Approach

**First-Open Detection:**
1. On app load, check localStorage: `const lastSeen = localStorage.getItem('lastWeeklySnapshotSeen')`
2. Get last Monday: `const lastMonday = getLastMonday(new Date())`
3. If `new Date(lastSeen) < lastMonday`: show modal
4. After dismiss: `localStorage.setItem('lastWeeklySnapshotSeen', new Date().toISOString())`

**Weekly Rollover Strategy:**
- **Option A (Vercel Cron):** Create `/api/cron/weekly-rollover`, configure in `vercel.json`: `{"crons": [{"path": "/api/cron/weekly-rollover", "schedule": "0 0 * * 1"}]}`
- **Option B (Client-side trigger):** On first-open detection, run rollover if not done this week
- **Recommended:** Option A for production (server-side, guaranteed execution), Option B for MVP

**Markdown Export Format:**
```markdown
# Weekly Snapshot - Week of Oct 14, 2025

## ✅ Done (15 tasks)
- **Work:** Finished proposal deck, reviewed PR #42
- **Personal:** Called Mom, scheduled dentist

## ⚠️ Slipped (3 tasks)
- "Update resume" (snoozed 3 times)
- "Research vacation spots" (overdue 8 days)

## 🎯 Focus Next Week
- **Project:** Launch campaign (mentioned 12 times this week)

## 📈 Rising Themes
- "launch" (+8 mentions vs last week)
- "design" (+5 mentions)
- "feedback" (+4 mentions)
```

### Technical Constraints

**Performance:**
- Analytics query must complete in < 5 seconds for 1000+ entries
- Use database indexes (Story 1.1)
- Paginate done tasks if > 100 (group by project, show top 5 per project)

**Data Consistency:**
- Rollover must be idempotent (running twice doesn't duplicate data)
- Rollover must be atomic (all term_frequencies updated in single transaction)

### File Locations

Create:
- `/src/components/intelligence/WeeklySnapshot.tsx` (modal component)
- `/src/app/api/analytics/weekly/route.ts` (analytics API)
- `/src/app/api/cron/weekly-rollover/route.ts` (cron job, if using Vercel Cron)
- `/src/utils/weeklyRollover.ts` (rollover logic)
- `/src/utils/markdown.ts` (markdown export utility)

---

## Tasks / Subtasks

### Task 1: Weekly Analytics API

- [ ] Create API route `/api/analytics/weekly/route.ts`
  - [ ] Export GET handler
  - [ ] Get user from auth
  - [ ] Parse query params: `weekStartDate` (optional, defaults to last Monday)
  - [ ] Calculate week bounds: `weekStart = lastMonday, weekEnd = weekStart + 7 days`

- [ ] Query done tasks
  - [ ] Supabase query: `SELECT * FROM tasks WHERE user_id = userId AND status = 'completed' AND completed_at >= weekStart AND completed_at < weekEnd ORDER BY completed_at DESC`
  - [ ] Group by project: extract `project_id` from tasks, group tasks by project
  - [ ] Group by person: extract `person_id` from tasks, group tasks by person
  - [ ] Return grouped structure: `{ byProject: { [projectName]: Task[] }, byPerson: { [personName]: Task[] } }`

- [ ] Query slipped tasks
  - [ ] Supabase query: `SELECT * FROM tasks WHERE user_id = userId AND (snooze_count >= 2 OR (due_at < now() - interval '7 days' AND status != 'completed')) ORDER BY due_at ASC`
  - [ ] Include snooze count and overdue days in response

- [ ] Query rising themes
  - [ ] Supabase query: `SELECT term, count_this_week, count_last_week, (count_this_week - count_last_week) AS delta FROM term_frequencies WHERE user_id = userId AND (count_this_week - count_last_week) > 0 ORDER BY delta DESC LIMIT 5`
  - [ ] Use `getWeeklyDelta(5)` from Story 1.1 if available

- [ ] Query focus project
  - [ ] Supabase query: `SELECT * FROM entities WHERE user_id = userId AND type = 'project' ORDER BY centrality DESC LIMIT 1`
  - [ ] Use `getTopEntitiesByCentrality('project', 1)` from Story 1.1 if available

- [ ] Return response
  - [ ] `return NextResponse.json({ done, slipped, risingThemes, focusProject })`
  - [ ] Cache for 5 minutes (use `revalidate: 300`)

### Task 2: Weekly Snapshot Component

- [ ] Create WeeklySnapshot component `/src/components/intelligence/WeeklySnapshot.tsx`
  - [ ] Use shadcn/ui Dialog component for modal
  - [ ] Props: `{ open: boolean, onClose: () => void, weekStartDate?: Date }`
  - [ ] Fetch data: `const data = await fetch('/api/analytics/weekly').then(r => r.json())`
  - [ ] Use SWR: `const { data } = useSWR('/api/analytics/weekly', fetcher)`

- [ ] Render "Done" section
  - [ ] Heading: "✅ Done (X tasks)"
  - [ ] Group by project: show project name, list tasks under it
  - [ ] Group by person: show person name, list tasks under it
  - [ ] If > 5 projects/people: show "View all" button (expand/collapse)

- [ ] Render "Slipped" section
  - [ ] Heading: "⚠️ Slipped (X tasks)"
  - [ ] For each slipped task: show title, reason (snoozed X times OR overdue Y days)
  - [ ] Highlight overdue > 14 days in red

- [ ] Render "Focus Next Week" section
  - [ ] Heading: "🎯 Focus Next Week"
  - [ ] Show focus project name
  - [ ] Show centrality (mentions this week)
  - [ ] If no focus project: show "No active projects detected"

- [ ] Render "Rising Themes" section
  - [ ] Heading: "📈 Rising Themes"
  - [ ] For each theme: show term, delta (+X mentions vs last week)
  - [ ] Visual: bar chart OR simple list with numbers
  - [ ] If no rising themes: show "No new themes detected"

- [ ] Add "Export to Markdown" button
  - [ ] Call `exportMarkdown(data)` function (Task 3)
  - [ ] Show success toast: "Copied to clipboard!"

- [ ] Add "Dismiss" button
  - [ ] Call `onClose()` callback
  - [ ] Update localStorage: `localStorage.setItem('lastWeeklySnapshotSeen', new Date().toISOString())`

### Task 3: Markdown Export Utility

- [ ] Create markdown export utility `/src/utils/markdown.ts`
  - [ ] Function: `exportWeeklySnapshot(data: WeeklyData): string`
  - [ ] Generate markdown string:
    ```markdown
    # Weekly Snapshot - Week of ${weekStartDate}

    ## ✅ Done (${done.length} tasks)
    ${groupedDone}

    ## ⚠️ Slipped (${slipped.length} tasks)
    ${slippedList}

    ## 🎯 Focus Next Week
    - **${focusProject.name}** (mentioned ${focusProject.centrality} times)

    ## 📈 Rising Themes
    ${risingThemesList}
    ```

- [ ] Copy to clipboard
  - [ ] Use `navigator.clipboard.writeText(markdown)`
  - [ ] Fallback for older browsers: create textarea, select, copy, remove

- [ ] Download as file
  - [ ] Create Blob: `const blob = new Blob([markdown], { type: 'text/markdown' })`
  - [ ] Create download link: `const url = URL.createObjectURL(blob)`
  - [ ] Trigger download: `<a href={url} download="weekly-snapshot.md">Download</a>`

### Task 4: First-Open Detection

- [ ] Add detection logic to app layout or journal page
  - [ ] In `/src/app/page.tsx` or `/src/app/layout.tsx`
  - [ ] `useEffect` on mount: check localStorage
  - [ ] Get last Monday: `const lastMonday = getLastMonday(new Date())`
  - [ ] Compare: `const lastSeen = new Date(localStorage.getItem('lastWeeklySnapshotSeen') || 0)`
  - [ ] If `lastSeen < lastMonday`: set state `showWeeklySnapshot = true`

- [ ] Render WeeklySnapshot modal conditionally
  - [ ] `{showWeeklySnapshot && <WeeklySnapshot open={showWeeklySnapshot} onClose={() => setShowWeeklySnapshot(false)} />}`

- [ ] Add manual trigger button (optional)
  - [ ] On Ontology page or settings page
  - [ ] Button: "View Weekly Snapshot"
  - [ ] onClick: `setShowWeeklySnapshot(true)`

### Task 5: Weekly Rollover Job

- [ ] Create rollover utility `/src/utils/weeklyRollover.ts`
  - [ ] Function: `async function weeklyRollover(): Promise<void>`
  - [ ] Query all term_frequencies: `SELECT * FROM term_frequencies`
  - [ ] For each record:
    - [ ] Update: `UPDATE term_frequencies SET count_last_week = count_this_week, count_this_week = 0 WHERE id = record.id`
  - [ ] Use Supabase batch update for performance:
    ```ts
    await supabase.rpc('weekly_rollover_batch')
    ```
  - [ ] Create Postgres function with SECURITY DEFINER to bypass RLS:
    ```sql
    CREATE OR REPLACE FUNCTION weekly_rollover_batch()
    RETURNS void
    SECURITY DEFINER  -- Critical: bypass RLS to update all users' term frequencies
    SET search_path = public
    AS $$
    BEGIN
      UPDATE term_frequencies SET count_last_week = count_this_week, count_this_week = 0;
    END;
    $$ LANGUAGE plpgsql;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION weekly_rollover_batch() TO authenticated;
    ```
    Note: SECURITY DEFINER runs the function with the privileges of the function owner (postgres), bypassing RLS policies

- [ ] Create cron endpoint `/api/cron/weekly-rollover/route.ts` (if using Vercel Cron)
  - [ ] Export GET handler
  - [ ] Verify cron secret: `if (req.headers.get('Authorization') !== \`Bearer ${process.env.CRON_SECRET}\`) return 401`
  - [ ] Use Supabase service-role client to call RPC (bypasses RLS):
    ```ts
    import { createClient } from '@supabase/supabase-js'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role key bypasses RLS
    )
    await supabase.rpc('weekly_rollover_batch')
    ```
  - [ ] Alternative: If using SECURITY DEFINER function, can use regular client:
    ```ts
    import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
    import { cookies } from 'next/headers'

    const supabase = createRouteHandlerClient({ cookies })
    await supabase.rpc('weekly_rollover_batch')  // Function runs as SECURITY DEFINER
    ```
  - [ ] Log rollover: `INSERT INTO weekly_rollover_log (rollover_date, terms_updated) VALUES (now(), <count>)`
  - [ ] Return: `{ success: true, termsUpdated: count }`

- [ ] Configure Vercel Cron (if using)
  - [ ] Create/update `vercel.json`:
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/weekly-rollover",
          "schedule": "0 0 * * 1"
        }
      ]
    }
    ```
  - [ ] Set `CRON_SECRET` in Vercel env vars

- [ ] Alternative: Client-side rollover trigger
  - [ ] On first-open detection, check if rollover needed:
    ```ts
    const lastRollover = localStorage.getItem('lastWeeklyRollover')
    if (new Date(lastRollover) < lastMonday) {
      await weeklyRollover()
      localStorage.setItem('lastWeeklyRollover', new Date().toISOString())
    }
    ```

### Task 6: Testing

- [ ] Unit tests for markdown export (Vitest)
  - [ ] Test: generate markdown from sample data
  - [ ] Verify format matches expected structure
  - [ ] Test clipboard copy (mock `navigator.clipboard.writeText`)

- [ ] Integration test for analytics API (Playwright)
  - [ ] Create test data: 5 completed tasks, 2 slipped tasks, 3 term frequency records
  - [ ] GET `/api/analytics/weekly`
  - [ ] Verify response structure
  - [ ] Verify done tasks grouped correctly
  - [ ] Verify rising themes calculated correctly

- [ ] E2E test for Weekly Snapshot modal (Playwright)
  - [ ] Set localStorage `lastWeeklySnapshotSeen` to 2 weeks ago
  - [ ] Refresh page
  - [ ] Verify modal appears
  - [ ] Verify sections display correctly
  - [ ] Click "Export to Markdown"
  - [ ] Verify clipboard contains markdown (mock clipboard API)
  - [ ] Click "Dismiss"
  - [ ] Verify modal closes
  - [ ] Verify localStorage updated

- [ ] Test weekly rollover (manual or integration test)
  - [ ] Set term_frequencies: `count_this_week = 10, count_last_week = 5`
  - [ ] Run rollover
  - [ ] Verify: `count_this_week = 0, count_last_week = 10`

### Task 7: Verify Existing Functionality

- [ ] Test journal page loads normally
  - [ ] With modal detection enabled
  - [ ] Verify no errors if no data

- [ ] Test Ontology page still works
  - [ ] Verify no conflicts with term_frequencies usage
  - [ ] Both Rising Themes (Story 1.5) and Keywords (Story 1.6) can coexist

- [ ] Test performance with large dataset
  - [ ] Create 1000 tasks, 500 term frequencies
  - [ ] Run analytics query
  - [ ] Verify < 5 second response time

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Weekly rollover runs multiple times, corrupting term counts
- **Mitigation:**
  - Idempotent rollover (check if already rolled over this week)
  - Use database transaction (atomic update)
  - Log each rollover with timestamp
- **Verification:**
  - Test: run rollover twice, verify counts don't double
  - Check rollover log for duplicates

**Secondary Risk:** Analytics query times out for users with 1000+ entries
- **Mitigation:**
  - Use database indexes (Story 1.1)
  - Limit done tasks to last 100 (paginate)
  - Use Supabase functions for aggregation (faster)
- **Verification:**
  - Load test with 1000+ entries
  - Measure query time

**Tertiary Risk:** Modal appears every page load (localStorage not updating)
- **Mitigation:**
  - Test localStorage write in multiple browsers
  - Fallback to session storage if localStorage fails
  - Add debug logging
- **Verification:**
  - Test in Chrome, Safari, Firefox
  - Clear cache, verify modal appears once

### Rollback Plan

If Weekly Snapshot causes issues:
1. Feature flag: `ENABLE_WEEKLY_SNAPSHOT=false`
2. Conditional render: `{process.env.ENABLE_WEEKLY_SNAPSHOT && <WeeklySnapshot />}`
3. Disable Vercel Cron (if using)

### Safety Checks

- [ ] Rollover is idempotent
- [ ] Analytics query completes in < 5 seconds
- [ ] Modal appears only once per week
- [ ] Existing journal/ontology pages work

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC8)
- [ ] All tasks completed
- [ ] Weekly Snapshot modal displays correctly
- [ ] Done/Slipped/Focus/Rising Themes sections functional
- [ ] Markdown export works (clipboard + download)
- [ ] First-open detection works
- [ ] Weekly rollover functional (Vercel Cron or client-side)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance test passes (< 5s for 1000+ entries)
- [ ] Existing functionality verified
- [ ] Code follows existing patterns
- [ ] TypeScript types defined
- [ ] PR created targeting `dev` branch
- [ ] Vercel preview deployment tested
- [ ] Vercel Cron configured (if using)

---

## File Checklist

**Create:**
- [ ] `/src/components/intelligence/WeeklySnapshot.tsx`
- [ ] `/src/app/api/analytics/weekly/route.ts`
- [ ] `/src/app/api/cron/weekly-rollover/route.ts` (if using Vercel Cron)
- [ ] `/src/utils/weeklyRollover.ts`
- [ ] `/src/utils/markdown.ts`
- [ ] `/src/utils/markdown.test.ts` (Vitest)
- [ ] `/tests/e2e/weekly-snapshot.spec.ts` (Playwright)
- [ ] `supabase/migrations/YYYYMMDDHHMMSS_weekly_rollover_function.sql` (Postgres function)

**Modify:**
- [ ] `/src/app/page.tsx` or `/src/app/layout.tsx` (add first-open detection)
- [ ] `vercel.json` (add cron configuration, if using Vercel Cron)

**Optional:**
- [ ] Create `weekly_rollover_log` table in database for audit trail
