# Story 1.10.1: Phase 1 - Clean Slate (Remove Old Implementation)

**Story ID**: 1.10.1
**Epic**: Epic 1.10 (Unified Tasks & Reminders System - Clean Rebuild)
**Type**: Technical Debt / Refactoring
**Status**: 🔄 IN PROGRESS
**Priority**: High (Blocker for Phase 2)
**Estimated Effort**: 1-2 days
**Created**: 2025-11-11
**Started**: 2025-11-11
**Related PR**: TBD

---

## Goal

Remove the existing tasks and reminders implementation completely to prepare for clean rebuild with PRD-spec architecture. This includes database schema, NLP detection code, UI components, API routes, and tests.

**Rationale**: Zero users + incomplete implementation + desire for OSS consistency = Clean rebuild is optimal path.

---

## Acceptance Criteria

### Database
- [ ] Delete or deprecate 7 migration files for old `tasks` and `reminders` tables
- [ ] Verify no references to old schema remain in codebase

### Code
- [ ] Delete 6 NLP utility files (taskDetection, dateParser, queryDetection + tests)
- [ ] Delete 2 DB utility files (tasks.ts + test)
- [ ] Delete 1 script (detect-query-tasks.ts)
- [ ] Refactor JournalStream.tsx to remove task integration (~400 lines)
- [ ] Delete 2 UI components (TaskCard, TaskEditDialog)
- [ ] Delete 3 API routes in `/api/tasks/` directory

### Tests
- [ ] Delete 3 E2E test files for old task flows
- [ ] Verify no broken imports or test failures

### Documentation
- [ ] Update STORY_INDEX.md to mark Stories 1.1, 1.2, 1.2.1, 1.2.2, 1.4 as deprecated
- [ ] Add deprecation notices in migration files (if keeping for history)

---

## Files to Delete (26 total)

### 1. Database Migrations (7 files)
```
supabase/migrations/20251020000000_content_intelligence_schema.sql
supabase/migrations/20251020000000_content_intelligence_schema_rollback.sql
supabase/migrations/20251023000000_add_task_deduplication_key.sql
supabase/migrations/20251023000000_add_task_deduplication_key_rollback.sql
supabase/migrations/20251026000000_add_task_status_accepted_rejected.sql
supabase/migrations/20251103000000_add_query_detection_to_tasks.sql
supabase/migrations/20251103000000_add_query_detection_to_tasks_rollback.sql
```

**CRITICAL CLARIFICATION - Migration Handling**:

⚠️ **Production Database**: The old `tasks` and `reminders` tables still exist in production/dev Supabase. Deleting migration files from source control does NOT delete the tables from the database.

**Strategy**:
- **DELETE** migration files from source control (clean start for Phase 2)
- **KEEP** old tables in database for now (no data loss)
- **Phase 2**: Create new schema migrations that will:
  1. Rename old tables to `_deprecated_tasks`, `_deprecated_reminders` (preserving history)
  2. Create new tables: `schedules`, `items`, `occurrences` (per PRD)
- **Post-Migration**: Later (after Phase 5), can optionally drop deprecated tables

**Bootstrap Notes**:
- New checkouts won't run the old migrations (files deleted)
- New Supabase projects will only get the Phase 2 schema (clean state)
- Existing dev/prod environments keep old tables (safe, non-breaking)

**Action**: Delete all 7 migration files from source control

---

### 2. NLP Utilities (6 files)
```
src/utils/nlp/taskDetection.ts              (175 lines)
src/utils/nlp/taskDetection.test.ts         (248 lines)
src/utils/nlp/dateParser.ts                 (453 lines)
src/utils/nlp/dateParser.test.ts            (366 lines)
src/utils/nlp/queryDetection.ts             (215 lines)
src/utils/nlp/queryDetection.test.ts        (272 lines)
```

**Dependencies**: Only used by `/api/tasks/parse` route (which will also be deleted)
**Action**: Delete all 6 files

---

### 3. Database Utilities (2 files)
```
src/lib/db/tasks.ts                         (234 lines)
src/lib/db/tasks.test.ts
```

**Dependencies**: Not imported anywhere in current codebase (API routes query Supabase directly)
**Action**: Delete both files

---

### 4. Scripts (1 file)
```
scripts/detect-query-tasks.ts               (113 lines)
```

**Purpose**: One-time batch script for Story 1.9.1
**Action**: Delete

---

### 5. E2E Tests (3 files)
```
tests/story-1.2-task-parsing.spec.ts        (15,683 lines)
tests/story-1.2.1-inline-task-cards.spec.ts (12,727 lines)
tests/story-1.2.1-task-card-ui.spec.ts      (7,347 lines)
```

**Action**: Delete all 3 files (will be replaced with new tests in Phase 3-5)

---

### 6. UI Components (2 files) - DELETE AFTER JOURNALSTREAM REFACTOR
```
src/components/tasks/TaskCard.tsx           (263 lines)
src/components/tasks/TaskEditDialog.tsx     (169 lines)
```

**Dependencies**: Imported by JournalStream.tsx
**Action**: Delete AFTER removing imports from JournalStream

---

### 7. API Routes (3 files) - DELETE AFTER JOURNALSTREAM REFACTOR
```
src/app/api/tasks/parse/route.ts            (219 lines)
src/app/api/tasks/bulk/route.ts             (82 lines)
src/app/api/tasks/[taskId]/route.ts         (173 lines)
```

**Dependencies**: Called by JournalStream.tsx
**Action**: Delete AFTER refactoring JournalStream

---

### 8. Shared Types & Database Client Regeneration

**Files to Update**:
- `src/types/note.ts` - Remove `taskIds`, `taskHashes` from `NoteMetadata` interface
- `src/lib/supabase-types.ts` - Regenerate to remove `tasks` and `reminders` table types
- `src/lib/database.types.ts` - Regenerate with `supabase gen types` (removes old schema)
- Any Zod schemas referencing task fields (search for `tasks` in `src/lib/validation/`)

**Action**:
1. Remove task fields from `NoteMetadata` type
2. Run `supabase gen types typescript --linked > src/lib/supabase-types.ts` to regenerate
3. Search for remaining references: `grep -r "tasks\|reminders" src/types src/lib --include="*.ts"`
4. Update any Zod schemas to remove task validation

**Acceptance Criterion**: `npm run build` passes with no TypeScript errors referencing deleted tables/types

---

### 9. JournalStream.tsx Refactoring (CRITICAL)

**File**: `src/components/journal/JournalStream.tsx`
**Impact**: ~400 lines of task integration code to remove

**Task Integration to Remove**:

1. **Imports**:
```typescript
// DELETE THESE IMPORTS
import TaskCard from '@/components/tasks/TaskCard';
import TaskEditDialog from '@/components/tasks/TaskEditDialog';
```

2. **State Management**:
```typescript
// DELETE THESE STATE VARIABLES
const [entryTasks, setEntryTasks] = useState<Map<string, any[]>>(new Map());
const [editingTask, setEditingTask] = useState<any | null>(null);
const [rejectedTaskHashes, setRejectedTaskHashes] = useState<Set<string>>(new Set());
const taskDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

3. **API Calls**: Remove all calls to:
   - `POST /api/tasks/parse`
   - `POST /api/tasks/bulk`
   - `PATCH /api/tasks/[taskId]`
   - `DELETE /api/tasks/[taskId]`

4. **Functions to Remove**:
   - `parseTasksForParagraph()` - Detects tasks in paragraph text
   - `handleTaskAccept()` - Accepts detected task
   - `handleTaskReject()` - Rejects detected task
   - `handleTaskEdit()` - Opens edit dialog
   - `handleTaskDelete()` - Deletes task
   - `handleTaskEditSave()` - Saves task edits

5. **UI Rendering**:
```typescript
// DELETE THIS RENDERING LOGIC
{entryTasks.get(note.id)?.map((task) => (
  <TaskCard
    key={task.id}
    task={task}
    onAccept={handleTaskAccept}
    onReject={handleTaskReject}
    onEdit={handleTaskEdit}
    onDelete={handleTaskDelete}
  />
))}

{editingTask && (
  <TaskEditDialog
    task={editingTask}
    open={!!editingTask}
    onClose={() => setEditingTask(null)}
    onSave={handleTaskEditSave}
  />
)}
```

6. **Metadata Storage**: Remove task-related fields from `note.metadata`:
   - `metadata.taskIds`
   - `metadata.taskHashes`
   - Any task-specific metadata storage/retrieval logic

**Refactoring Strategy**:
- Remove all task-related code in one commit
- Verify JournalStream still renders correctly without task features
- Update any TypeScript interfaces if needed
- Test that journal entry creation/editing still works

---

## Implementation Plan

### Step 1: Safe Deletions (No Dependencies)
Delete 19 files with no active dependencies:
- 7 migration files
- 6 NLP utilities + tests
- 2 DB utilities + tests
- 1 script
- 3 E2E test files

**Commit**: `chore: Remove old tasks/reminders infrastructure (migrations, NLP, tests, utils)`

---

### Step 2: Refactor JournalStream.tsx
Remove ~400 lines of task integration:
- Delete imports (TaskCard, TaskEditDialog)
- Remove state variables (entryTasks, editingTask, rejectedTaskHashes, taskDetectionTimeoutRef)
- Remove API calls to `/api/tasks/*` endpoints
- Remove task detection logic and functions
- Remove TaskCard/TaskEditDialog rendering
- Clean up metadata schema

**Commit**: `refactor: Remove task detection and inline task cards from JournalStream`

**Testing**:
- Verify journal entry creation works
- Verify journal entry editing works
- Verify no console errors
- Verify no broken imports

---

### Step 3: Delete Remaining Components and API Routes
Now safe to delete since JournalStream no longer depends on them:
- `src/components/tasks/TaskCard.tsx`
- `src/components/tasks/TaskEditDialog.tsx`
- `src/app/api/tasks/parse/route.ts`
- `src/app/api/tasks/bulk/route.ts`
- `src/app/api/tasks/[taskId]/route.ts`
- `src/components/tasks/` directory (now empty)
- `src/app/api/tasks/` directory (now empty)

**Commit**: `chore: Delete deprecated task UI components and API routes`

---

### Step 4: Clean Up Secondary Artifacts

**Remove References in Documentation**:
- [ ] `docs/stories/STORY_INDEX.md` - Mark Stories 1.1, 1.2, 1.2.1, 1.2.2, 1.4 as ⚠️ DEPRECATED
- [ ] Any `.md` files referencing task parsing flows (search with `grep -r "task.*parse\|detect.*task" docs/`)
- [ ] Update `docs/architecture/` if it mentions old task schema or NLP flow

**Clean Up Test Artifacts**:
- [ ] Remove old test results, screenshots: `test-results/`, `playwright-report/` (if stored in git)
- [ ] Remove task-specific test fixtures or mocks from `tests/fixtures/`
- [ ] Search for references in `tests/README.md` or test setup files

**Remove from CI/Build Scripts**:
- [ ] Check `.github/workflows/` for any explicit task-test runners
- [ ] Remove task-specific environment variables from CI configs
- [ ] Update any linting ignore patterns that referenced task files

**Commit**: `docs: Mark old task/reminder stories as deprecated and clean up artifacts`

---

### Step 5A (Alternative): Update Shared Types (if needed before JournalStream refactor)

If you prefer to update types BEFORE JournalStream refactoring to catch type errors early:
- Run `supabase gen types typescript --linked > src/lib/supabase-types.ts`
- Update `src/types/note.ts` to remove task fields
- This lets the next step (JournalStream refactor) start with clean types

**Commit**: `refactor: Remove task fields from shared types and regenerate Supabase client`

---

### Step 5: Comprehensive Verification

**Build & Lint**:
- [ ] Run `npm run build` - should succeed with no errors
- [ ] Run `npm run lint` - should pass
- [ ] Run `npm run type-check` - should pass with no TS errors

**Automated Tests**:
- [ ] Run `npm run test` (unit tests) - all pass
- [ ] Run `npx playwright test` (E2E tests) - all pass (should be fewer tests now)
- [ ] Verify no broken test imports referencing deleted files

**Manual Testing**:
- [ ] Journal entry creation works
- [ ] Journal entry editing works
- [ ] Journal entry deletion works
- [ ] Prototype widgets render correctly
- [ ] No console errors or warnings

**Code Search Verification**:
- [ ] `grep -r "TaskCard\|TaskEditDialog" src/` - should be empty
- [ ] `grep -r "api/tasks" src/` - should be empty (except maybe comments)
- [ ] `grep -r "taskDetection\|dateParser\|queryDetection" src/` - should be empty
- [ ] `grep -r "_deprecated_tasks\|_deprecated_reminders" src/` - should be empty (those are in DB phase 2)

**Git Status**:
- [ ] Only intentional deletions, no accidental changes
- [ ] All new files (story docs) are staged
- [ ] `git diff --cached` shows expected deletions only

---

## Risks & Mitigation

**Risk**: Accidentally break journal functionality during JournalStream refactoring
**Mitigation**:
- Test journal entry creation/editing after refactor
- Keep refactor commit separate so it's easy to review/revert
- Have user test on Vercel preview before merging

**Risk**: Miss some task-related code in other files
**Mitigation**:
- Use grep to search for remaining references after deletion
- Check for imports of deleted files
- Run build to catch broken imports

**Risk**: Database still contains old tasks/reminders tables
**Mitigation**:
- Phase 1 only removes *code*, not database data (for safety)
- Phase 2 will create new schema with deprecation/rename of old tables
- Can manually clean up database later if needed

---

## Success Criteria

- ✅ All 26 files deleted
- ✅ No broken imports or TypeScript errors
- ✅ `npm run build` succeeds
- ✅ `npm run lint` passes
- ✅ Journal entry creation/editing still works
- ✅ Prototype widgets still render correctly
- ✅ Documentation updated (STORY_INDEX.md)
- ✅ All changes committed and pushed to PR

---

## Follow-up Stories

After Phase 1 completion:
- **Story 1.10.2**: Phase 2 - Create new PRD-spec database schema (schedules, items, occurrences)
- **Story 1.10.3**: Phase 2 - Implement TypeScript types and Supabase RLS policies
- **Story 1.10.4**: Phase 2 - Create database indexes and triggers

---

## Notes

- This is a destructive change but safe because we have zero users
- Old task detection was inline (during journal entry); new system will be widget-based
- Keeping prototype widgets (RemindersWidget, TasksWidget, temporalMockData) - those are NEW
- Can always reference git history if we need to see old implementation
