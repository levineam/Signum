# Epic 1.10: Unified Tasks & Reminders System - Clean Rebuild

**Epic ID**: 1.10
**Epic Type**: Greenfield Rebuild (Clean Slate)
**Parent Epic**: Epic 1 (Content Intelligence & Feedback System)
**Replaces**: Stories 1.1, 1.2, 1.2.1, 1.2.2, 1.4
**Related Issue**: TBD
**Status**: 📋 Draft - Awaiting Final Approval
**Estimated Duration**: 4-5 weeks (27 stories)
**Created**: November 6, 2025
**Updated**: November 6, 2025 (Clean Rebuild Approach Approved)
**Documents**: Project Brief (attached), PRD (attached), UI Mockup (attached)

---

## Epic Goal

**Build a unified, OSS-standard temporal system for Tasks and Reminders from scratch**, replacing the existing incomplete implementation with a PRD-spec architecture (RFC 5545 recurrence, schedules/items/occurrences tables), persistent UI widgets above the journal, and production-grade notifications via Supabase Edge Functions. This enables users to capture, schedule, and act on time-bound items directly from their journal context.

**Approach**: Clean rebuild with no migration constraints (zero users = freedom to build it right).

---

## Strategic Decision: Clean Rebuild Rationale

### Why Clean Rebuild vs Migration?

**User Context (CRITICAL)**:
- ✅ **Zero users** - No migration pain, no data loss risk
- ✅ **Existing implementation is "not great"** - Better to rebuild than extend
- ✅ **Want OSS consistency** - Minimize modifications to rrule.js, Supabase patterns

**Technical Benefits**:
1. **OSS-Standard Schema**: PRD spec aligns with RFC 5545 (rrule.js), CalDAV, iCal patterns
2. **No Technical Debt**: Remove "not great" NLP code, start fresh
3. **Faster Development**: No backward compatibility, no migration logic (saves 1 week)
4. **Future-Proof**: Built for external calendar sync, advanced recurrence from day one
5. **Cleaner Codebase**: No legacy code to work around, no deprecated endpoints

**Removed/Rebuilt Components**:
- 🗑️ **Database**: Drop `tasks`, `reminders` tables → Build `schedules`, `items`, `occurrences`
- 🗑️ **NLP**: Remove `taskDetection.ts`, `dateParser.ts` → Rebuild with better classification
- 🗑️ **UI**: Remove `TaskCard.tsx`, `TaskEditDialog.tsx` → New widget-based UI
- 🗑️ **API**: Remove `/api/tasks/*` routes → New `/api/items/*` RESTful API
- 🗑️ **Tests**: Remove Story 1.2 E2E tests → New comprehensive test suite

---

## Epic Description

### Existing System Context

**What Currently Exists (To Be Removed)**:

#### Database Schema (Story 1.1 - TO BE DEPRECATED)
- **tasks table**: Basic structure, not fully utilized (title, status, due_at, rrule stub)
- **reminders table**: Separate table (will be unified into `items.kind`)
- **Issues**: No timezone support, no occurrence generation, basic recurrence

#### NLP Detection (Story 1.2 - TO BE REMOVED)
- **taskDetection.ts**: Pattern-based, not great quality
- **dateParser.ts**: Wraps chrono-node, but limited
- **TaskCard.tsx**: Inline suggestions only, no persistent UI
- **API routes**: `/api/tasks/parse`, `/api/tasks/bulk`, `/api/tasks/[taskId]`
- **Issues**: No task vs reminder classification, brittle patterns

#### UI Components (Keeping These)
- ✅ **JournalStream.tsx**: Main journal interface (we'll add widgets above this)
- ✅ **SimpleRichEditor.tsx**: Rich text editor (unchanged)
- ✅ **Sidebar**: Navigation (unchanged, Epic 2.5 complete)

**Technology Stack (Unchanged)**:
- Next.js 15.5.3 (App Router, Turbopack), React 19.1.0, TypeScript ^5
- Supabase (Postgres 17, Auth, RLS, Edge Functions, pg_cron)
- shadcn/ui with Notebook theme, lucide-react icons, Tailwind CSS
- Existing libraries to leverage: rrule.js (^2.8.1), chrono-node (^2.9.0), date-fns (^4.1.0)
- **Will add**: date-fns-tz (for timezone support)

**Integration Points**:
1. **Home Page Layout** (`src/app/page.tsx`): Insert Reminders/Tasks widgets above journal
2. **JournalStream Component**: Keep existing, add widgets above
3. **Supabase Edge Functions**: New `/supabase/functions/` for dispatch, roll-forward logic
4. **shadcn/ui Components**: Dialog, Card, Badge, Tooltip, DataTable, Sheet
5. **RLS Policies**: New policies for schedules, items, occurrences tables

---

### Enhancement Details

**What's Being Built (PRD Spec)**:

#### Phase 0: Clean Slate - Remove Old Implementation (Week 1, Days 1-2, Stories 3.0.1-3.0.7)

**Goal**: Remove existing tasks/reminders infrastructure completely, prepare for rebuild.

**Database Removal**:
- Drop tables: `tasks`, `reminders` (or rename to `_deprecated` suffix)
- Remove associated RLS policies, indexes, constraints
- Mark old migrations as deprecated in comments

**Code Removal**:
- **NLP**: Delete `src/utils/nlp/taskDetection.ts`, `dateParser.ts`, `queryDetection.ts` (if task-specific)
- **UI**: Delete `src/components/tasks/TaskCard.tsx`, `TaskEditDialog.tsx`
- **API**: Delete `src/app/api/tasks/` directory (all routes)
- **DB Utils**: Delete `src/lib/db/tasks.ts`
- **Tests**: Delete `tests/story-1.2-task-parsing.spec.ts`, `story-1.2.1-*.spec.ts`
- **Scripts**: Delete `scripts/detect-query-tasks.ts` (if exists)

**Audit Dependencies**:
- Keep `chrono-node` (used elsewhere, e.g., voice transcription)
- Keep `rrule.js` (will use heavily in rebuild)
- Keep `date-fns` (will extend with date-fns-tz)

**Deliverable**: Clean slate, no task/reminder code remains.

---

#### Phase 1: PRD Schema Foundation (Week 1, Days 3-5, Stories 3.1.1-3.1.4)

**Goal**: Implement PRD-spec database schema with OSS-standard structure.

**New Tables (RFC 5545 / CalDAV Compatible)**:

```sql
-- schedules: RFC 5545 recurrence rules (rrule.js native format)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_at TIMESTAMPTZ NOT NULL,
  tzid TEXT NOT NULL,                -- IANA timezone (e.g., "America/New_York")
  rrule TEXT,                        -- RFC 5545 string (nullable for one-offs)
  exdates TIMESTAMPTZ[] DEFAULT '{}' -- Exception dates (for "this occurrence" edits)
);

-- items: Unified task/reminder entity
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('reminder','task')) NOT NULL,
  title TEXT NOT NULL,
  note TEXT,                                       -- Optional description
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  channels JSONB DEFAULT '["inapp"]'::jsonb,       -- ['inapp','push','email']
  metadata JSONB DEFAULT '{}'::jsonb,              -- {journalEntryId, priority, estimateMin, tags}
  status TEXT CHECK (status IN ('open','closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- occurrences: Computed instances (next-occurrence-only strategy)
CREATE TABLE occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL,                     -- Due time (UTC)
  actual_at TIMESTAMPTZ,                           -- When notified/completed
  status TEXT CHECK (status IN ('pending','notified','completed','skipped','snoozed'))
         NOT NULL DEFAULT 'pending',
  source TEXT CHECK (source IN ('schedule','manual')) DEFAULT 'schedule',
  snooze_until TIMESTAMPTZ,
  snooze_count INT DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_schedules_user ON schedules((SELECT user_id FROM items WHERE items.schedule_id = schedules.id));
CREATE INDEX idx_items_user_kind ON items(user_id, kind);
CREATE INDEX idx_items_user_status ON items(user_id, status);
CREATE INDEX idx_occurrences_pending ON occurrences (run_at) WHERE status = 'pending';
CREATE INDEX idx_occurrences_item ON occurrences(item_id);

-- RLS Policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own items
CREATE POLICY "Users can CRUD their own items" ON items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own occurrences" ON occurrences
  FOR ALL TO authenticated
  USING (
    item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
  )
  WITH CHECK (
    item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can CRUD their own schedules" ON schedules
  FOR ALL TO authenticated
  USING (
    id IN (SELECT schedule_id FROM items WHERE user_id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT schedule_id FROM items WHERE user_id = auth.uid())
  );

-- Trigger: Update updated_at on items
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**TypeScript Types**:

```typescript
// src/types/temporal.ts

export type ItemKind = 'reminder' | 'task';

export type OccurrenceStatus = 'pending' | 'notified' | 'completed' | 'skipped' | 'snoozed';

export type Schedule = {
  id: string;
  startAt: string; // ISO 8601 timestamp
  tzid: string;    // IANA timezone
  rrule?: string;  // RFC 5545 recurrence rule
  exdates?: string[]; // Exception dates (ISO 8601)
};

export type Item = {
  id: string;
  userId: string;
  kind: ItemKind;
  title: string;
  note?: string;
  scheduleId?: string;
  channels?: ('inapp' | 'push' | 'email')[];
  metadata?: {
    journalEntryId?: string;
    priority?: 'low' | 'medium' | 'high';
    estimateMin?: number;
    tags?: string[];
  };
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
};

export type Occurrence = {
  id: string;
  itemId: string;
  runAt: string; // ISO 8601 timestamp (UTC)
  actualAt?: string;
  status: OccurrenceStatus;
  source: 'schedule' | 'manual';
  snoozeUntil?: string;
  snoozeCount: number;
};

// Hydrated types (with joins)
export type ItemWithSchedule = Item & {
  schedule?: Schedule;
};

export type OccurrenceWithItem = Occurrence & {
  item: ItemWithSchedule;
};
```

---

#### Phase 2: UI Foundation (Week 2, Stories 3.2.1-3.2.6)

**Goal**: Build Reminders/Tasks widget UI above journal (per mockup).

**Reminders Widget** (`src/components/widgets/RemindersWidget.tsx`):
- Collapsible Card with header: "Reminders" + Badge (count) + ChevronDown
- Body: DataTable list (Title, Due time, Actions: Complete, Snooze)
- Empty state: "No reminders" + "+ New Reminder" button
- Collapse animation (300ms height transition)
- localStorage: Persist collapse state per user

**Tasks Widget** (`src/components/widgets/TasksWidget.tsx`):
- Parallel to Reminders Widget
- Body: DataTable list (Title, Due time, Priority badge, Actions: Complete, Edit, Delete)
- Empty state: "No tasks" + "+ New Task" button

**Home Page Integration** (`src/app/page.tsx` or `JournalStream.tsx`):
- Layout: `<RemindersWidget /> <TasksWidget /> <JournalStream />`
- Responsive: Stack vertically on mobile (<768px)
- Widgets above journal, below header

**Create Dialogs**:
- `CreateReminderDialog.tsx`: Title, Date/Time, Recurrence, Channels
- `CreateTaskDialog.tsx`: Title, Due Date/Time, Priority, Estimate, Recurrence
- Use shadcn Dialog + Form + DateTimePicker (react-day-picker + time input)
- RecurrenceBuilder: Simple presets (None, Daily, Weekly, Monthly) + Custom RRULE

**Data Fetching**:
- React Query hooks: `useItems(kind)`, `useOccurrences()`
- Real-time subscriptions: Supabase Realtime on occurrences table
- Optimistic updates for actions (Complete, Snooze)

---

#### Phase 3: Temporal Core (Week 2-3, Stories 3.3.1-3.3.5)

**Goal**: Recurrence engine + notification dispatch (Edge Functions).

**Recurrence Service** (`src/lib/temporal/recurrence.ts`):
- Function: `computeNextOccurrence(schedule: Schedule, after: Date): Date | null`
- Uses rrule.js with tzid for timezone-aware computation
- Handles EXDATE (skip exception dates)
- Handles UNTIL and COUNT termination
- Returns null if series complete

**Edge Function: Dispatch Due Occurrences** (`supabase/functions/dispatchDueOccurrences/index.ts`):
- **Cron**: `* * * * *` (every minute) via Supabase Dashboard or `supabase/functions/dispatchDueOccurrences/cron.json`
- **Logic**:
  1. Select pending occurrences: `status='pending'` AND `run_at <= now()` AND `(snooze_until IS NULL OR snooze_until <= now())`
  2. Lock rows: `SELECT ... FOR UPDATE SKIP LOCKED` (idempotency)
  3. For each occurrence:
     - Send notification via channels (in-app, push, email)
     - Mark status = 'notified' (or leave 'pending' for tasks if user prefers)
     - Compute next occurrence from schedule (if recurring)
     - Insert new occurrence row if next exists
  4. Commit transaction
- **Error handling**: Retry with exponential backoff, log failures
- **Monitoring**: Track dispatch latency, success rate

**In-App Notifications** (sonner toast):
- Real-time subscription to occurrences table
- Toast appears when occurrence status → 'notified'
- Toast actions: View (opens OccurrenceSheet), Snooze, Dismiss

**Web Push Notifications** (VAPID):
- Service Worker: `public/sw.js` handles push events
- VAPID keys stored in Supabase secrets
- Push subscription stored in user profile (metadata JSONB)
- Permission prompt: `PushPermissionDialog.tsx` on first use
- Edge Function sends push via Web Push API

**Timezone Support**:
- Store IANA timezone in `schedules.tzid`
- Use date-fns-tz for timezone-aware date display
- Detect browser timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Allow user override in settings (future)

---

#### Phase 4: Actions & Workflows (Week 3-4, Stories 3.4.1-3.4.7)

**Goal**: Complete, Snooze, Skip, Edit, Delete actions with UI flows.

**API Routes** (`src/app/api/items/*`):
- `POST /api/items` - Create item (with optional schedule)
- `GET /api/items` - List items (query: kind, status)
- `GET /api/items/:id` - Get item details
- `PATCH /api/items/:id` - Update item
- `DELETE /api/items/:id` - Soft delete item
- `POST /api/items/:id/complete` - Complete occurrence
- `POST /api/items/:id/snooze` - Snooze occurrence
- `POST /api/items/:id/skip` - Skip occurrence
- `POST /api/items/:id/edit-scope` - Edit this vs series

**Complete Action**:
- Mark occurrence `status = 'completed'`, set `actual_at = now()`
- If recurring task: Compute next, insert new occurrence
- If recurring reminder: Already handled by dispatch
- If non-recurring: Set item `status = 'closed'`
- UI: Complete button (✓ icon), optimistic update, toast confirmation

**Snooze Action**:
- Set `snooze_until = now() + duration`, increment `snooze_count`
- Presets: 10m, 1h, Tomorrow 8am, Custom time picker
- UI: Snooze button (Clock icon) → Popover with presets

**Skip Action**:
- Mark occurrence `status = 'skipped'`
- Compute next, insert new occurrence
- UI: Skip button (ChevronRight icon), confirmation dialog

**Edit This vs Series**:
- AlertDialog: "Edit this occurrence or entire series?"
- **This occurrence**: Add run_at to `schedules.exdates`, create one-off override (new item, no schedule)
- **Entire series**: Update `schedules.rrule`, `start_at`, recompute next occurrence
- UI: Edit button (Pencil icon) → triggers scope dialog

**Delete Action**:
- Soft delete: Set `items.status = 'closed'` OR hard delete (CASCADE to occurrences)
- Confirmation dialog: "Delete this item? This cannot be undone."
- UI: Delete button (Trash2 icon), red color

**Occurrence Detail Sheet** (`src/components/widgets/OccurrenceSheet.tsx`):
- shadcn Sheet component (slide-out from right)
- Displays: Title, Note, Due time (timezone-aware), Recurrence summary, Source entry link
- Actions: Complete, Snooze, Skip, Edit (this/series), Delete
- Keyboard shortcuts: Enter = complete, S = snooze, Escape = close

---

#### Phase 5: Journal Integration & NLP (Week 4, Stories 3.5.1-3.5.4)

**Goal**: Create items from journal, write back completions, rebuild NLP classification.

**Source Entry Linking**:
- When creating from journal context: Store `metadata.journalEntryId`
- Display in OccurrenceSheet: "Created from [Entry Title]" link
- Clicking link navigates to journal entry

**Completion Write-Back**:
- On complete action: If `metadata.journalEntryId` exists, append line to entry
- Format: `<p>✓ Completed <strong>[Task Title]</strong> at [timestamp]</p>`
- Use entry update API: `PATCH /api/entries/:id` (append to content)

**Rebuilt NLP Classification** (`src/lib/nlp/temporalDetection.ts`):
- Function: `detectTemporalItem(text: string): { kind: 'task' | 'reminder', title: string, dueDate?: Date } | null`
- **Task patterns**: "need to", "must", "should", "todo", "task:", "[ ]"
- **Reminder patterns**: "remind me", "reminder", "don't forget", "remember to"
- **Date extraction**: Use chrono-node with timezone awareness
- **Confidence scoring**: Return null if confidence < 70%
- Better quality than old taskDetection.ts

**Inline Suggestion (Optional, Story 1.10.5.4)**:
- Rebuild TaskCard-like UI for suggestions
- Toggle: "Create as Task" | "Create as Reminder"
- Accept → Opens CreateDialog with pre-filled data
- Reject → Dismiss suggestion

**Inline Chips in Journal (Optional, Phase 1.5)**:
- Show upcoming occurrences for entry's date
- Chip format: `[📋 Task Title - Due 3pm] [🔔 Reminder - Due 5pm]`
- Click chip → Opens OccurrenceSheet
- One-tap actions: Complete (✓), Snooze (Clock) icons on chip

---

### How It Integrates

**Visual Integration**:
- Widgets appear above journal, below header
- Collapsed by default (journal-first focus)
- Expand on click: Smooth height animation (300ms cubic-bezier)
- Mobile: Stack vertically, full-width, touch-optimized

**State Management**:
- React Query for server state (items, occurrences)
- Supabase Realtime for live updates (occurrences table)
- localStorage for widget collapse preference
- Optimistic updates for actions (Complete, Snooze)

**Notification Integration**:
- Edge Function dispatches on cron (every minute)
- In-app: sonner toast with actions
- Web Push: VAPID, Service Worker handles background notifications
- Channels per item: User can toggle in metadata

**Theme Integration**:
- All UI uses shadcn primitives (Card, Badge, Button, Dialog, Sheet, Popover)
- Respects light/dark mode via ThemeProvider
- Icons from lucide-react: Bell, CheckCircle, Clock, Calendar, ChevronDown, Trash2, Pencil

---

## Success Criteria (27 Total)

### Phase 0: Clean Slate
1. ✅ Old `tasks` and `reminders` tables dropped or renamed `_deprecated`
2. ✅ All NLP code removed (`taskDetection.ts`, `dateParser.ts`)
3. ✅ All task UI components removed (`TaskCard.tsx`, `TaskEditDialog.tsx`)
4. ✅ All `/api/tasks/*` routes deleted
5. ✅ All test files for Story 1.2 removed
6. ✅ Build succeeds with no errors (`npm run build`)

### Phase 1: PRD Schema
7. ✅ `schedules`, `items`, `occurrences` tables created with correct structure
8. ✅ RLS policies enforce user-level access (tested with anon client)
9. ✅ Indexes created for performance (pending occurrences, item lookups)
10. ✅ TypeScript types match database schema exactly

### Phase 2: UI Foundation
11. ✅ Reminders widget appears above journal with badge count
12. ✅ Tasks widget appears above journal with badge count
13. ✅ Widgets expand/collapse with smooth animation
14. ✅ Empty states display with "+ New" CTAs
15. ✅ Create dialogs work: Title, Date/Time, Recurrence, Channels
16. ✅ Mobile: Widgets stack vertically, responsive layout works

### Phase 3: Temporal Core
17. ✅ Recurrence engine computes next occurrence correctly (20+ unit tests)
18. ✅ Edge Function dispatches due occurrences within 60s (p95 latency)
19. ✅ RRULE parsing handles DAILY/WEEKLY/MONTHLY + BYDAY/UNTIL/COUNT
20. ✅ Timezone-aware scheduling works across DST boundaries
21. ✅ In-app notifications appear as toasts with actions
22. ✅ Web push notifications work (VAPID, Service Worker)

### Phase 4: Actions
23. ✅ Complete action marks done, rolls forward if recurring
24. ✅ Snooze action delays notification (presets: 10m/1h/tomorrow)
25. ✅ Skip action moves to next occurrence
26. ✅ Edit "this vs series" works with EXDATE or schedule update
27. ✅ Delete action soft-deletes with confirmation

### Phase 5: Journal Integration
28. ✅ Creating item from journal stores `metadata.journalEntryId`
29. ✅ Completion writes back to journal entry
30. ✅ NLP classification distinguishes tasks vs reminders (>80% accuracy)

### Quality Gates
31. ✅ All UI uses shadcn/ui primitives (no custom components)
32. ✅ Playwright E2E tests cover all user flows (20+ scenarios)
33. ✅ Accessibility: Keyboard nav, ARIA labels, screen reader support
34. ✅ Performance: Widget render <100ms, dispatch p95 <60s
35. ✅ Security: RLS policies prevent cross-user access (anon client verified)

---

## Stories Breakdown (30 Stories, 5-5.5 Weeks)

### Phase 0: UI Design & Prototyping (NEW - Week 1, Days 1-3)

#### Story 1.10.0.1: UI Design Mockups & Component Planning (0.5 day)

**Goal**: Plan the UI architecture and component structure before building.

**Scope**:
- Review UI mockup from user (hand-drawn: Reminders | Tasks boxes)
- Identify all shadcn/ui components needed (Card, Badge, Dialog, Sheet, Popover, etc.)
- Document component hierarchy and data flow
- Create component inventory spreadsheet/doc

**Deliverables**:
- Component inventory doc: List of all components to build
- shadcn component dependencies identified
- Data shape documented (mock data structures)

**Acceptance Criteria**:
- Given component inventory, when reviewed, then all UI flows covered
- Given mock data shapes, when reviewed, then match final schema design

---

#### Story 1.10.0.2: Interactive Prototype - Widgets & Create Dialogs (1 day)

**Goal**: Build non-functional Reminders/Tasks widgets with hardcoded data.

**Scope**:
- **RemindersWidget** (`src/components/widgets/RemindersWidget.tsx`):
  - Header: "Reminders" + Badge (count=3) + ChevronDown icon
  - Body (collapsed/expanded): DataTable with 3 hardcoded reminders
  - Actions: Complete, Snooze buttons (non-functional, just UI)
  - Empty state: "No reminders" + "+ New Reminder" button
  - Collapse animation (300ms)

- **TasksWidget** (`src/components/widgets/TasksWidget.tsx`):
  - Parallel to RemindersWidget
  - Badge (count=5), 5 hardcoded tasks
  - Actions: Complete, Edit, Delete buttons (non-functional)

- **CreateReminderDialog** (`src/components/widgets/CreateReminderDialog.tsx`):
  - shadcn Dialog with Form
  - Fields: Title (text), Date/Time (DateTimePicker mock), Recurrence (simple select), Channels (checkboxes)
  - Submit button (closes dialog, no save)

- **CreateTaskDialog** (`src/components/widgets/CreateTaskDialog.tsx`):
  - Parallel to CreateReminderDialog
  - Fields: Title, Due Date/Time, Priority (Low/Med/High), Estimate (minutes), Recurrence

**Mock Data**:
```typescript
const mockReminders = [
  { id: '1', title: 'Call mom', dueAt: '2025-11-06T17:00:00Z', status: 'pending' },
  { id: '2', title: 'Doctor appointment', dueAt: '2025-11-07T09:30:00Z', status: 'pending' },
  { id: '3', title: 'Team standup', dueAt: '2025-11-06T10:00:00Z', status: 'pending' }
];

const mockTasks = [
  { id: '1', title: 'Finish report', dueAt: '2025-11-08T17:00:00Z', priority: 'high', status: 'pending' },
  { id: '2', title: 'Review PRs', dueAt: '2025-11-06T16:00:00Z', priority: 'medium', status: 'pending' },
  { id: '3', title: 'Update docs', dueAt: '2025-11-09T12:00:00Z', priority: 'low', status: 'pending' },
  { id: '4', title: 'Grocery shopping', dueAt: '2025-11-07T18:00:00Z', priority: 'medium', status: 'pending' },
  { id: '5', title: 'Plan sprint', dueAt: '2025-11-08T14:00:00Z', priority: 'high', status: 'pending' }
];
```

**Integration**:
- Add widgets to `src/app/page.tsx` or `JournalStream.tsx` above journal
- Test responsive layout (mobile: stack vertically)
- Widgets use localStorage for collapse state

**Deliverables**:
- 4 components built (RemindersWidget, TasksWidget, CreateReminderDialog, CreateTaskDialog)
- Mock data service: `src/lib/mock/temporalMockData.ts`
- Visual polish (spacing, icons, colors match Notebook theme)

**Testing**:
- Manual: Click "+ New Reminder" → Dialog opens
- Manual: Click header → Widget collapses/expands
- Manual: Test on mobile (<768px) → Widgets stack
- Manual: Action buttons show correct states (hover, disabled, etc.)

**Acceptance Criteria**:
- Given Reminders widget, when page loads, then shows 3 reminders with badge "3"
- Given "+ New Reminder" button, when clicked, then dialog opens with form
- Given widget header, when clicked, then expands/collapses with animation
- Given mobile viewport, when page loads, then widgets stack vertically

---

#### Story 1.10.0.3: Interactive Prototype - Occurrence Detail & Actions (0.5 day)

**Goal**: Build OccurrenceSheet (slide-out detail view) and action flows.

**Scope**:
- **OccurrenceSheet** (`src/components/widgets/OccurrenceSheet.tsx`):
  - shadcn Sheet (slide-out from right)
  - Display: Title, Note, Due time, Recurrence summary, Source entry link (mocked)
  - Actions: Complete, Snooze, Skip, Edit, Delete buttons
  - Keyboard shortcuts: Enter (complete), S (snooze), Escape (close)

- **SnoozePopover** (`src/components/widgets/SnoozePopover.tsx`):
  - Popover with presets: 10 min, 1 hour, Tomorrow 8am, Custom
  - Click preset → Toast shows "Snoozed until [time]" (no actual snooze)

**Mock Interactions**:
- Click reminder/task → Opens OccurrenceSheet
- Click Complete → Toast "Completed [title]", sheet closes
- Click Snooze → Popover opens, select preset → Toast
- Click Delete → AlertDialog "Delete this item?" → Confirm → Toast

**Deliverables**:
- OccurrenceSheet component
- SnoozePopover component
- Toast notifications wired (using sonner)

**Testing**:
- Manual: Click reminder → Sheet opens
- Manual: Press Enter → Completes, shows toast
- Manual: Press S → Snooze popover opens
- Manual: Click Delete → Confirmation dialog

**Acceptance Criteria**:
- Given reminder clicked, when clicked, then OccurrenceSheet opens
- Given OccurrenceSheet open, when Enter pressed, then shows completion toast
- Given Snooze button, when clicked, then popover shows presets

---

#### Story 1.10.0.4: User Feedback & UX Iteration (0.5-1 day)

**Goal**: Deploy prototype to Vercel preview, gather feedback, iterate on design.

**Scope**:
- Deploy to Vercel preview (create feature branch `prototype/tasks-reminders-ui`)
- Test on multiple devices (desktop, tablet, mobile)
- Gather feedback from user on:
  - Widget placement (above journal - correct position?)
  - Collapse/expand UX (default collapsed? animation speed?)
  - Create dialog flow (fields make sense? too many steps?)
  - Mobile layout (stacking works? touch targets large enough?)
  - Action button placement (intuitive? accessible?)
  - Color/spacing (matches Notebook theme?)
- Document feedback and make design tweaks
- Final sign-off from user before proceeding to backend

**Deliverables**:
- Vercel preview URL (e.g., `https://signum-prototype-tasks-reminders.vercel.app`)
- Feedback document: `docs/stories/story-1.10.0.4-ui-feedback.md`
- Updated components based on feedback
- User approval to proceed with backend development

**Testing**:
- Manual: Test all flows on iPhone Safari, Android Chrome
- Manual: Test keyboard navigation (Tab, Enter, Escape)
- Manual: Screen reader test (VoiceOver, NVDA)

**Acceptance Criteria**:
- Given Vercel preview, when tested on mobile, then all interactions work
- Given user feedback, when reviewed, then all concerns addressed
- Given final prototype, when approved, then proceed to Phase 1

---

### Phase 1: Clean Slate (Week 1, Days 4-5)

#### Story 1.10.1: Drop Existing Database Tables (0.5 day)
- Migration: Drop or rename `tasks`, `reminders` to `_deprecated`
- Remove RLS policies, indexes, constraints
- Mark old migrations as deprecated in comments

#### Story 1.10.0.2: Remove Existing NLP Code (0.5 day)
- Delete: `src/utils/nlp/taskDetection.ts`, `dateParser.ts`, `queryDetection.ts`
- Remove exports from index files
- Audit: Keep chrono-node (used elsewhere)

#### Story 1.10.0.3: Remove Existing UI Components (0.5 day)
- Delete: `src/components/tasks/TaskCard.tsx`, `TaskEditDialog.tsx`
- Remove imports from JournalStream.tsx
- Verify build succeeds

#### Story 1.10.0.4: Remove Existing API Routes (0.5 day)
- Delete: `src/app/api/tasks/` directory (all routes)
- Remove any middleware/utilities
- Update import references

#### Story 1.10.0.5: Remove Database Utilities (0.25 day)
- Delete: `src/lib/db/tasks.ts` and `.test.ts`
- Clean up any task queries in other DB files

#### Story 1.10.0.6: Remove Test Files (0.25 day)
- Delete: `tests/story-1.2-task-parsing.spec.ts`, `story-1.2.1-*.spec.ts`
- Remove from test suites

#### Story 1.10.0.7: Clean Build Verification (0.5 day)
- Run `npm run build` - verify success
- Run `npm run lint` - verify no errors
- Manual smoke test: Journal still works

---

### Phase 1: PRD Schema Foundation (Week 1, Days 3-5)

#### Story 1.10.1.1: Create PRD Schema Migration (1 day)
- SQL migration: `schedules`, `items`, `occurrences` tables (see schema above)
- RLS policies for all 3 tables
- Indexes for performance
- Deploy to dev environment

#### Story 1.10.1.2: TypeScript Types & Database Client (0.5 day)
- Create: `src/types/temporal.ts` (Schedule, Item, Occurrence)
- Database client: `src/lib/db/temporal.ts` (CRUD functions)
- Supabase type generation: `npx supabase gen types typescript`

#### Story 1.10.1.3: RLS Policy Testing (0.5 day)
- Verify anon client cannot access items
- Verify user A cannot access user B's items
- Verify cascading deletes work correctly

#### Story 1.10.1.4: Seed Data for Development (0.5 day)
- Script: `scripts/seed-temporal-dev.ts`
- Create 5 sample reminders, 5 sample tasks
- Various recurrence patterns (daily, weekly, monthly, one-off)

---

### Phase 2: UI Foundation (Week 2)

#### Story 1.10.2.1: Reminders Widget Component (2 days)
- Component: `src/components/widgets/RemindersWidget.tsx`
- Header: Title + Badge + ChevronDown
- Body: DataTable (Title, Due, Actions)
- Empty state, collapse animation
- localStorage for state

#### Story 1.10.2.2: Tasks Widget Component (2 days)
- Component: `src/components/widgets/TasksWidget.tsx`
- Parallel to 3.2.1 but for tasks
- Priority badge display

#### Story 1.10.2.3: Integrate Widgets into Home Page (1 day)
- Update: `src/app/page.tsx` or JournalStream
- Layout: Widgets above journal
- Responsive: Stack on mobile
- React Query hooks: useItems, useOccurrences

#### Story 1.10.2.4: Create Reminder Dialog (2 days)
- Component: `src/components/widgets/CreateReminderDialog.tsx`
- Fields: Title, Date/Time, Recurrence, Channels
- RecurrenceBuilder: Presets + custom
- API: POST /api/items (kind='reminder')

#### Story 1.10.2.5: Create Task Dialog (2 days)
- Component: `src/components/widgets/CreateTaskDialog.tsx`
- Fields: Title, Due, Priority, Estimate, Recurrence
- Parallel to 3.2.4
- API: POST /api/items (kind='task')

#### Story 1.10.2.6: Items API Routes - CRUD (1 day)
- POST /api/items - Create
- GET /api/items - List (filter: kind, status)
- GET /api/items/:id - Get details
- PATCH /api/items/:id - Update
- DELETE /api/items/:id - Soft delete

---

### Phase 3: Temporal Core (Week 2-3)

#### Story 1.10.3.1: Recurrence Engine Service (2 days)
- Service: `src/lib/temporal/recurrence.ts`
- Function: computeNextOccurrence(schedule, after)
- Uses rrule.js with tzid
- Handles EXDATE, UNTIL, COUNT
- Unit tests: 20+ cases, DST boundaries

#### Story 1.10.3.2: Edge Function - Dispatch Due Occurrences (3 days)
- Edge Function: `supabase/functions/dispatchDueOccurrences/index.ts`
- Cron: * * * * * (every minute)
- Logic: Select pending, lock rows, dispatch, compute next, insert
- Error handling, monitoring
- Manual trigger endpoint for testing

#### Story 1.10.3.3: In-App Notifications (1 day)
- Component: `src/components/notifications/OccurrenceToast.tsx`
- Supabase Realtime subscription to occurrences
- Toast actions: View, Snooze, Dismiss
- Integrate sonner in root layout

#### Story 1.10.3.4: Web Push Notifications (3 days)
- Service Worker: `public/sw.js`
- VAPID key generation, storage in Supabase secrets
- Component: `src/components/notifications/PushPermissionDialog.tsx`
- API: POST /api/push/subscribe (store push endpoint)
- Edge Function: Send push via Web Push API
- Test on Chrome, Firefox, Safari

#### Story 1.10.3.5: Timezone Support (1 day)
- Add date-fns-tz dependency
- Detect browser timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Display times in user timezone (all date UI)
- Store tzid in schedules, default to browser timezone
- Test DST boundaries (March, November)

---

### Phase 4: Actions & Workflows (Week 3-4)

#### Story 1.10.4.1: Complete Action (2 days)
- API: POST /api/items/:id/complete
- Logic: Mark completed, roll forward if recurring, close if one-off
- UI: Complete button (✓), optimistic update
- Test: One-off, recurring task, recurring reminder

#### Story 1.10.4.2: Snooze Action (1 day)
- API: POST /api/items/:id/snooze
- Body: duration (10m/1h/1d/custom)
- UI: Snooze button → Popover with presets
- Test: Verify no notification until snooze_until

#### Story 1.10.4.3: Skip Action (1 day)
- API: POST /api/items/:id/skip
- Logic: Mark skipped, compute next, insert
- UI: Skip button, confirmation
- Test: Skip occurrence, verify next appears

#### Story 1.10.4.4: Edit This vs Series (2 days)
- API: POST /api/items/:id/edit-scope (body: scope, updates)
- Logic: This → EXDATE + override; Series → update schedule
- UI: AlertDialog "Edit this or series?"
- Test: This occurrence (EXDATE), series (rrule update)

#### Story 1.10.4.5: Delete Action (1 day)
- API: DELETE /api/items/:id (soft delete)
- UI: Delete button, confirmation dialog
- Test: Delete item, verify no longer appears

#### Story 1.10.4.6: Occurrence Detail Sheet (2 days)
- Component: `src/components/widgets/OccurrenceSheet.tsx`
- shadcn Sheet (slide-out)
- Display: Title, Note, Due, Recurrence, Source link
- Actions: Complete, Snooze, Skip, Edit, Delete
- Keyboard shortcuts: Enter (complete), S (snooze), Escape (close)

#### Story 1.10.4.7: Occurrences API Routes (1 day)
- GET /api/occurrences - List (filter: status, item_id, date range)
- GET /api/occurrences/:id - Get details
- Hydrated response: Include item + schedule

---

### Phase 5: Journal Integration & NLP (Week 4)

#### Story 1.10.5.1: Source Entry Linking (1 day)
- Update CreateDialogs: Accept `source_entry_id` prop
- Store in `metadata.journalEntryId`
- Display in OccurrenceSheet: "Created from [Entry]" link
- Test: Create from journal, click link, navigates correctly

#### Story 1.10.5.2: Completion Write-Back (1 day)
- Update complete API: If `metadata.journalEntryId`, append line to entry
- Format: `<p>✓ Completed <strong>[Title]</strong> at [timestamp]</p>`
- Use: PATCH /api/entries/:id (append to content)
- Test: Complete task, verify line in journal entry

#### Story 1.10.5.3: Rebuilt NLP Classification (2 days)
- Service: `src/lib/nlp/temporalDetection.ts`
- Function: detectTemporalItem(text): { kind, title, dueDate } | null
- Patterns: Task ("need to", "must") vs Reminder ("remind me")
- Date extraction: chrono-node with timezone
- Confidence scoring (>70% threshold)
- Unit tests: 30+ test cases
- Test: "remind me to call mom tomorrow" → reminder, due=tomorrow

#### Story 1.10.5.4: Inline Suggestion Card (Optional, 2 days)
- Component: `src/components/journal/TemporalSuggestionCard.tsx`
- Detect temporal items in journal paragraphs
- Show card with toggle: "Create as Task" | "Create as Reminder"
- Accept → Opens CreateDialog with pre-filled data
- Reject → Dismiss
- Test: Type "need to finish report", verify task suggestion appears

---

### Phase 1.5: Nice-to-Have (Optional, Week 5)

#### Story 1.10.6.1: Unified Today View (Optional, 2 days)
- Component: `src/components/widgets/TodayView.tsx`
- Combined list: Tasks + Reminders
- DataTable: Kind badge, Title, Due, Actions
- Group by: Overdue, Today, Upcoming
- Settings toggle: Separate widgets (default) vs Unified

#### Story 1.10.6.2: Calendar View (Optional, 3 days)
- Component: `src/components/widgets/CalendarView.tsx`
- Use react-day-picker
- Render occurrences as chips on days
- Click day → List items for that day
- Click item → Opens OccurrenceSheet
- Page: /calendar route

#### Story 1.10.6.3: Command Palette Quick-Add (Optional, 1 day)
- Extend cmdk palette: "Create Task", "Create Reminder"
- Shortcuts: ⌘K → type "task" or "reminder"
- Opens appropriate dialog

#### Story 1.10.6.4: Email Notifications (Optional, 2 days)
- Email provider integration (Resend/SendGrid)
- Edge Function: Send email when channels includes 'email'
- Email template: Subject, Body, CTA link

#### Story 1.10.6.5: Weekly Digest (Optional, 2 days)
- Edge Function: weeklyDigest (cron: Mon 8am)
- Email: Last week completed, this week upcoming
- User preference toggle

---

## Compatibility Requirements

### Component Compatibility
- ✅ Widgets use shadcn/ui (Card, Badge, Dialog, Sheet, Button, Popover)
- ✅ JournalStream unchanged (widgets added above, not inside)
- ✅ SimpleRichEditor unchanged
- ✅ Sidebar unaffected (Epic 2.5 complete)

### Data Compatibility
- ✅ New schema, no migration constraints
- ✅ RLS policies follow existing patterns (user_id scoping)
- ✅ JSONB metadata for extensibility (like existing tables)

### UI Compatibility
- ✅ Respects light/dark theme
- ✅ Responsive layout (<768px mobile)
- ✅ Follows Notebook theme color scheme

### Performance Compatibility
- ✅ Widget render <100ms
- ✅ Notification dispatch p95 <60s
- ✅ Real-time subscriptions optimized (React Query caching)
- ✅ Database indexes for fast queries

### Accessibility Compatibility
- ✅ Keyboard navigation (Tab, Enter, Escape, S)
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader support for badge counts
- ✅ Focus management in dialogs/sheets

---

## Risk Mitigation

### Primary Risk: Edge Function Reliability - MEDIUM

**Risk**: Edge Function might miss occurrences or send duplicates.

**Mitigation**:
1. Row-level locks: `SELECT FOR UPDATE SKIP LOCKED`
2. Idempotent dispatch: Check occurrence status before processing
3. Monitoring: Supabase Function Logs + alerts on failure
4. Retry logic: Exponential backoff for push/email
5. Manual trigger: Admin endpoint to re-dispatch

**Rollback**: Disable Edge Function, manual dispatch from admin UI, or in-app polling (fallback).

---

### Secondary Risk: NLP Classification Accuracy - LOW

**Risk**: NLP incorrectly classifies tasks vs reminders.

**Mitigation**:
1. Confidence scoring (>70% threshold)
2. Manual toggle: User can override classification
3. Easy conversion: "Convert to Task/Reminder" action
4. Help docs: Explain difference with examples

**Rollback**: Remove distinction, treat all as "items" with notification toggle.

---

### Tertiary Risk: Mobile UX (Vertical Space) - LOW

**Risk**: Widgets take too much space, hide journal.

**Mitigation**:
1. Default collapsed on mobile
2. Sticky preference (localStorage)
3. Mobile-first testing (iOS Safari, Android Chrome)

**Rollback**: Move widgets to /tasks page, or bottom-sheet (slide up from bottom).

---

### Quaternary Risk: Timezone DST Bugs - LOW

**Risk**: Occurrences miscalculated around DST boundaries.

**Mitigation**:
1. Use rrule.js with tzid (handles DST automatically)
2. Unit tests for spring forward (March 10), fall back (November 3)
3. Snapshot tests around DST dates

**Rollback**: Store as naive UTC, add 1-hour buffer warning around DST dates.

---

## Definition of Done

### Epic-Level DoD

- ✅ All Phase 0-4 stories completed (Phase 5 required, 1.5 optional)
- ✅ Old tasks/reminders code completely removed
- ✅ PRD schema deployed to production
- ✅ Reminders and Tasks widgets live on home page
- ✅ Notification dispatch Edge Function running on cron
- ✅ In-app and web push notifications working (p95 <60s)
- ✅ Complete, Snooze, Skip, Edit, Delete actions functional
- ✅ Journal integration: Source linking, write-back
- ✅ NLP classification: Task vs reminder (>80% accuracy)
- ✅ Playwright E2E tests: 20+ scenarios
- ✅ Accessibility: Keyboard nav, ARIA, screen reader
- ✅ Performance: Widget <100ms, dispatch <60s
- ✅ Security: RLS tested with anon client
- ✅ Documentation: User guide, API docs, ERD
- ✅ PR merged to `dev`, tested on Vercel preview, merged to `main`

### Per-Story DoD

- ✅ Acceptance criteria met
- ✅ TypeScript strict, 2-space indent, ESLint clean
- ✅ `npm run build` succeeds
- ✅ Unit tests (if applicable)
- ✅ Playwright E2E tests (user-facing features)
- ✅ Tested locally with `npm run dev`
- ✅ PR created with description, screenshots/video, test plan
- ✅ Codex review requested (CI auto-posts `@codex review`)
- ✅ Tested on Vercel preview
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Timeline Estimate

### Optimistic (4.5 weeks)
- Phase 0 (UI Prototype): 2.5 days ← **NEW**
- Phase 1 (Clean Slate): 2 days
- Phase 2 (Schema): 2 days
- Phase 3 (UI Wiring): 1 week (faster - UI already built)
- Phase 4 (Temporal): 1.5 weeks
- Phase 5 (Actions): 1 week
- Phase 6 (Journal): 3 days
- Buffer: 2 days

### Realistic (5 weeks) ⭐ RECOMMENDED
- Phase 0 (UI Prototype): 3 days ← **NEW - Validate UX early**
- Phase 1 (Clean Slate): 2.5 days
- Phase 2 (Schema): 2.5 days
- Phase 3 (UI Wiring): 1.5 weeks (faster - components exist)
- Phase 4 (Temporal): 1.5 weeks
- Phase 5 (Actions): 1.5 weeks
- Phase 6 (Journal): 4 days
- Buffer: 3 days

### Pessimistic (6 weeks)
- Phase 0 (UI Prototype): 4 days (multiple iterations)
- Phase 1 (Clean Slate): 3 days
- Phase 2 (Schema): 3 days (RLS policy debugging)
- Phase 3 (UI Wiring): 2 weeks (integration issues)
- Phase 4 (Temporal): 2 weeks (DST edge cases, dispatch debugging)
- Phase 5 (Actions): 2 weeks (edit this/series complexity)
- Phase 6 (Journal): 1 week (NLP tuning)
- Buffer: 1 week

**Recommended Target**: 5 weeks (realistic)

**Key Benefit of Phase 0**: Validate UX before backend work = reduce rework risk

**Savings vs Migration Approach**: ~1 week saved (no migration logic, no backward compatibility)

---

## Dependencies

### External Dependencies
- ✅ **Supabase Edge Functions**: Available (tested in Story 2.4.4)
- ✅ **Supabase pg_cron**: Available via Dashboard
- ✅ **rrule.js**: Installed (^2.8.1)
- ✅ **chrono-node**: Installed (^2.9.0)
- ✅ **react-day-picker**: Installed (^9.11.1)
- ✅ **Web Push API**: Browser support >90%
- ⚠️ **date-fns-tz**: NOT installed, add in Story 1.10.3.5

### Internal Dependencies (Story Sequence)
1. **Phase 0 → Phase 1**: Must complete removal before schema creation
2. **Phase 1 → Phase 2**: Schema must exist before UI (can mock initially)
3. **Phase 2 → Phase 3**: UI can be built before dispatch (use manual trigger)
4. **Phase 3 → Phase 4**: Dispatch should work before actions (or mock)
5. **Phase 4 → Phase 5**: Actions complete before journal integration
6. **All phases → Codex review**: Every push triggers `@codex review`

**Parallelization**:
- Phase 2: Stories 3.2.1 & 3.2.2 (Widgets) parallel
- Phase 2: Stories 3.2.4 & 3.2.5 (Create Dialogs) parallel
- Phase 3: Stories 3.3.3 & 3.3.4 (Notifications) after 3.3.2

---

## Related Documentation

### Project Documentation
- **PRD**: Attached file (13a243db-14bc-4d39-88f8-46007ab9f362.txt)
- **Project Brief**: Attached file (6c7d3a96-513b-4fc6-9361-4974553b55eb.txt)
- **UI Mockup**: Attached image (23a2742f-1752-4016-a696-d16ed78e88bd.jpg)
- **Main PRD**: `docs/prd.md`
- **Story Index**: `docs/stories/STORY_INDEX.md`
- **Tech Stack**: `docs/architecture/tech-stack.md`
- **Coding Standards**: `docs/architecture/coding-standards.md`
- **CLAUDE.md**: `.claude/CLAUDE.md` (PR workflow, Vercel testing)

### Related Stories (To Be Deprecated)
- ~~Story 1.1: Core NLP Infrastructure~~ → Replaced by Epic 3
- ~~Story 1.2: Task/Reminder Parsing~~ → Replaced by Epic 3
- ~~Story 1.2.1: Inline Task Cards~~ → Replaced by Epic 3
- **Story 1.3**: Paragraph Detection (⏸️ Partial, unrelated to Epic 3)
- **Epic 2.5**: Sidebar Redesign (✅ Complete, no conflict)

### External References
- **RFC 5545**: iCalendar RRULE specification
- **VAPID**: Web Push Protocol (IETF RFC 8292)
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **rrule.js**: https://github.com/jakubroztocil/rrule
- **date-fns-tz**: https://github.com/marnusw/date-fns-tz

---

## Open Questions (RESOLVED)

**✅ All Critical Decisions Made:**

1. **Schema Approach**: ✅ **PRD Spec (Clean Rebuild)** - Option A/B discussion obsolete
2. **Widget Default State**: ✅ **Collapsed** (journal-first philosophy)
3. **Email Notifications**: ✅ **Phase 1.5 (optional)** - In-app + push required for Phase 1
4. **Calendar View**: ✅ **Phase 1.5 (optional)** - Widget-based UI is MVP
5. **Inline Chips (Story 1.10.5.4)**: ✅ **Optional** - Defer to Phase 1.5 if time permits
6. **Task Notification Behavior**: ✅ **Notify when due** (like reminders), user must complete

**Remaining User Preferences (Nice-to-Have)**:
- Widget collapse state persistence (default: collapsed)
- Notification sound preference (default: system sound)
- Snooze preset customization (default: 10m/1h/8am)

---

## Validation Checklist

### Scope Validation
- ✅ Epic can be completed in 27 stories (5 phases)
- ✅ Clean rebuild approach approved by user
- ✅ OSS consistency prioritized (RFC 5545, rrule.js native)
- ✅ No migration complexity (zero users)
- ✅ Enhancement follows Signum patterns (shadcn, RLS, JSONB)
- ✅ Mockup guidance incorporated (separate Reminders/Tasks boxes)

### Risk Assessment
- ✅ Risk to existing system is LOW (clean rebuild, no migration)
- ✅ Rollback plan is feasible (revert PR, re-enable old code if needed)
- ✅ Testing approach comprehensive (Playwright, manual Vercel preview, DST tests)
- ✅ All critical decisions finalized by user

### Completeness Check
- ✅ Epic goal clear (unified tasks/reminders, PRD spec, clean rebuild)
- ✅ Stories properly scoped (0.25-3 days each, some parallelizable)
- ✅ Success criteria measurable (35 concrete criteria)
- ✅ Dependencies identified (phase sequence, external libs)
- ✅ Phase 0 (removal) fully scoped with 7 stories
- ✅ Timeline realistic (4.5 weeks, saves 1 week vs migration)

---

**Epic Status**: ✅ **READY FOR IMPLEMENTATION** (Clean Rebuild Approved)

**Next Actions**:
1. ✅ **User approved Clean Rebuild approach**
2. **User confirms final approval of this epic document**
3. **Create GitHub issue for Epic 3** with this document
4. **Dev begins Story 1.10.0.1** (Drop existing database tables)
5. **Follow PR-based workflow** (feature branch, PR per story, Codex review, Vercel preview, user merges)

---

_This epic replaces the incomplete tasks/reminders implementation (Stories 1.1-1.2) with a production-grade, OSS-standard temporal system that brings scheduling and notifications to the forefront of the journaling experience—built right from the ground up._
