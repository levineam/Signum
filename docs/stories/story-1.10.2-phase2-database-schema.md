# Story 1.10.2: Phase 2 - Database Schema Design

**Story ID**: 1.10.2
**Epic**: Epic 1.10 (Unified Tasks & Reminders System - Clean Rebuild)
**Type**: Database / Architecture
**Status**: 🔄 IN PROGRESS
**Priority**: High (Foundation for Phase 2)
**Estimated Effort**: 2-3 days
**Created**: 2025-11-12
**Started**: 2025-11-12
**Related PR**: TBD

---

## Goal

Design and implement the new PRD-spec database schema for the unified Tasks & Reminders system using RFC 5545 (iCalendar) recurrence rules. This includes creating the `schedules`, `items`, and `occurrences` tables, setting up RLS policies, and deprecating old tables.

**Architecture**: Following the PRD's three-table design:
1. **schedules** - Defines recurrence patterns (RFC 5545 RRULE)
2. **items** - Individual tasks/reminders with their content
3. **occurrences** - Materialized instances of recurring items

---

## Acceptance Criteria

### Database Schema
- [ ] Create `schedules` table with RFC 5545 RRULE support
- [ ] Create `items` table for tasks and reminders
- [ ] Create `occurrences` table for materialized instances
- [ ] Rename old tables to `_deprecated_tasks` and `_deprecated_reminders`
- [ ] Create database indexes for performance
- [ ] Create database triggers for auto-updating timestamps

### RLS Policies
- [ ] Implement Row-Level Security on all three tables
- [ ] Users can only access their own schedules
- [ ] Users can only access their own items
- [ ] Users can only access their own occurrences
- [ ] Test RLS policies with multiple users

### Data Types & Constraints
- [ ] Proper foreign key relationships
- [ ] Check constraints for data integrity
- [ ] Default values where appropriate
- [ ] NOT NULL constraints on required fields

### Documentation
- [ ] Schema diagram (ER diagram)
- [ ] Migration scripts with rollback
- [ ] RLS policy documentation
- [ ] Index strategy documentation

---

## Database Schema Design

### 1. Schedules Table

Defines recurrence patterns using RFC 5545 RRULE standard.

```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recurrence rule (RFC 5545 format)
  -- Example: "FREQ=DAILY;INTERVAL=1;UNTIL=20251231T235959Z"
  rrule TEXT NOT NULL,

  -- Timezone for recurrence calculation
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Optional: EXDATE (exception dates) as JSON array
  -- Example: ["2025-11-25", "2025-12-25"]
  exception_dates JSONB DEFAULT '[]'::jsonb,

  -- Optional: RDATE (additional dates) as JSON array
  -- Example: ["2025-11-26"]
  recurrence_dates JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_rrule CHECK (rrule ~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)'),
  CONSTRAINT valid_exception_dates CHECK (jsonb_typeof(exception_dates) = 'array'),
  CONSTRAINT valid_recurrence_dates CHECK (jsonb_typeof(recurrence_dates) = 'array')
);

-- Indexes
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_rrule ON schedules USING gin(to_tsvector('simple', rrule));

-- RLS Policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Items Table

Individual tasks or reminders with their content and metadata.

```sql
CREATE TYPE item_type AS ENUM ('task', 'reminder');
CREATE TYPE item_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item classification
  item_type item_type NOT NULL,

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ, -- For one-time items or override

  -- Task-specific fields
  priority priority_level DEFAULT 'medium',
  estimate_minutes INTEGER, -- Time estimate

  -- Reminder-specific fields
  reminder_time TIMESTAMPTZ, -- When to remind (can differ from due_at)
  snooze_until TIMESTAMPTZ, -- Snoozed until this time

  -- Status
  status item_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_estimate CHECK (estimate_minutes > 0),
  CONSTRAINT completed_at_requires_completed_status CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  ),
  CONSTRAINT one_time_or_recurring CHECK (
    (schedule_id IS NULL AND due_at IS NOT NULL) OR
    (schedule_id IS NOT NULL) OR
    (schedule_id IS NULL AND due_at IS NULL)
  )
);

-- Indexes
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_schedule_id ON items(schedule_id);
CREATE INDEX idx_items_due_at ON items(due_at) WHERE status = 'pending';
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_priority ON items(priority) WHERE item_type = 'task';
CREATE INDEX idx_items_reminder_time ON items(reminder_time) WHERE item_type = 'reminder';

-- Full-text search on title and description
CREATE INDEX idx_items_search ON items USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- RLS Policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Occurrences Table

Materialized instances of recurring items for efficient querying.

```sql
CREATE TABLE occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  -- Occurrence details
  scheduled_at TIMESTAMPTZ NOT NULL, -- When this occurrence is scheduled

  -- Instance-specific overrides
  title TEXT, -- Override parent item title
  description TEXT, -- Override parent item description
  due_at TIMESTAMPTZ, -- Override parent item due_at
  reminder_time TIMESTAMPTZ, -- Override parent item reminder_time

  -- Status (per-instance)
  status item_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Skip flag (for skipped recurring instances)
  is_skipped BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT completed_at_requires_completed_status CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  ),
  CONSTRAINT unique_occurrence_per_schedule UNIQUE (item_id, scheduled_at)
);

-- Indexes
CREATE INDEX idx_occurrences_user_id ON occurrences(user_id);
CREATE INDEX idx_occurrences_item_id ON occurrences(item_id);
CREATE INDEX idx_occurrences_scheduled_at ON occurrences(scheduled_at);
CREATE INDEX idx_occurrences_status ON occurrences(status);
CREATE INDEX idx_occurrences_pending ON occurrences(scheduled_at, status)
  WHERE status = 'pending' AND is_skipped = FALSE;

-- RLS Policies
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own occurrences"
  ON occurrences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own occurrences"
  ON occurrences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own occurrences"
  ON occurrences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own occurrences"
  ON occurrences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_occurrences_updated_at
  BEFORE UPDATE ON occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Helper Function

Create the `update_updated_at_column()` function if it doesn't exist:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. Deprecate Old Tables

```sql
-- Rename old tables for historical reference
ALTER TABLE IF EXISTS tasks RENAME TO _deprecated_tasks;
ALTER TABLE IF EXISTS reminders RENAME TO _deprecated_reminders;

-- Add deprecation notice comments
COMMENT ON TABLE _deprecated_tasks IS
  'DEPRECATED: Replaced by items/schedules/occurrences schema in Epic 1.10.
   Preserved for historical reference. Safe to drop after 2025-12-31.';

COMMENT ON TABLE _deprecated_reminders IS
  'DEPRECATED: Replaced by items/schedules/occurrences schema in Epic 1.10.
   Preserved for historical reference. Safe to drop after 2025-12-31.';
```

---

## Schema Diagram

```
┌─────────────────────┐
│     schedules       │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ rrule               │◄───────┐
│ timezone            │        │
│ exception_dates     │        │
│ recurrence_dates    │        │
│ created_at          │        │
│ updated_at          │        │
└─────────────────────┘        │
                               │
                               │ schedule_id (FK, nullable)
                               │
┌─────────────────────┐        │
│       items         │        │
├─────────────────────┤        │
│ id (PK)             │◄───────┘
│ user_id (FK)        │
│ item_type           │◄───────┐
│ title               │        │
│ description         │        │
│ schedule_id (FK)    │────────┘
│ due_at              │
│ priority            │
│ estimate_minutes    │
│ reminder_time       │
│ snooze_until        │
│ status              │
│ completed_at        │
│ metadata            │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ item_id (FK)
         │
         ▼
┌─────────────────────┐
│    occurrences      │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ item_id (FK)        │
│ scheduled_at        │
│ title (override)    │
│ description (ovr)   │
│ due_at (override)   │
│ reminder_time (ovr) │
│ status              │
│ completed_at        │
│ is_skipped          │
│ metadata            │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

---

## Migration Strategy

### Migration File Structure

**Forward Migration**: `supabase/migrations/YYYYMMDDHHMMSS_phase2_schema_foundation.sql`
**Rollback Migration**: `supabase/migrations/YYYYMMDDHHMMSS_phase2_schema_foundation_rollback.sql`

### Migration Steps

1. Create helper function (`update_updated_at_column`)
2. Create ENUMs (`item_type`, `item_status`, `priority_level`)
3. Create `schedules` table with indexes, RLS, and triggers
4. Create `items` table with indexes, RLS, and triggers
5. Create `occurrences` table with indexes, RLS, and triggers
6. Deprecate old tables (rename with `_deprecated_` prefix)

### Rollback Steps

1. Drop `occurrences` table
2. Drop `items` table
3. Drop `schedules` table
4. Drop ENUMs
5. Restore old table names (`_deprecated_tasks` → `tasks`, `_deprecated_reminders` → `reminders`)

---

## Index Strategy

### Performance Optimization

1. **User Isolation**: All tables indexed on `user_id` for RLS performance
2. **Time-based Queries**: Indexes on `due_at`, `scheduled_at`, `reminder_time`
3. **Status Filtering**: Partial indexes on `status = 'pending'` for active item queries
4. **Full-Text Search**: GIN index on `title` and `description` for search functionality
5. **Recurrence Lookups**: Index on `schedule_id` for finding all items in a schedule

### Expected Query Patterns

1. "Show all pending tasks for today" → `idx_items_due_at`, `idx_items_status`
2. "Show all upcoming reminders" → `idx_items_reminder_time`
3. "Find all occurrences for a recurring item" → `idx_occurrences_item_id`
4. "Search tasks by keyword" → `idx_items_search`
5. "Show high-priority tasks" → `idx_items_priority`

---

## RLS Policy Testing

### Test Cases

1. **User A cannot see User B's items**
   ```sql
   -- As User A
   SELECT * FROM items WHERE user_id = '<user_b_id>'; -- Should return empty
   ```

2. **User A cannot update User B's items**
   ```sql
   -- As User A
   UPDATE items SET title = 'Hacked' WHERE user_id = '<user_b_id>'; -- Should fail
   ```

3. **User A can CRUD their own items**
   ```sql
   -- As User A
   INSERT INTO items (user_id, item_type, title) VALUES ('<user_a_id>', 'task', 'Test');
   UPDATE items SET title = 'Updated' WHERE user_id = '<user_a_id>';
   DELETE FROM items WHERE user_id = '<user_a_id>';
   ```

4. **Cascading deletes work correctly**
   ```sql
   -- Delete a schedule
   DELETE FROM schedules WHERE id = '<schedule_id>';
   -- All related items should have schedule_id = NULL
   -- All related occurrences should remain (soft delete pattern)
   ```

---

## Implementation Plan

### Step 1: Create Migration Files
- [ ] Create forward migration SQL file
- [ ] Create rollback migration SQL file
- [ ] Test locally with Supabase CLI

### Step 2: Apply Migration
- [ ] Run migration on local Supabase instance
- [ ] Verify all tables created correctly
- [ ] Verify indexes created
- [ ] Verify RLS policies active

### Step 3: Test RLS Policies
- [ ] Create test users
- [ ] Run test queries as different users
- [ ] Verify isolation between users

### Step 4: Documentation
- [ ] Document schema in README
- [ ] Create ER diagram
- [ ] Document RLS policies
- [ ] Document index strategy

### Step 5: Verification
- [ ] Run `supabase db diff` to verify schema
- [ ] Check for any missing indexes
- [ ] Verify all constraints work
- [ ] Test rollback migration

---

## Risks & Mitigation

**Risk**: RRULE parsing complexity
**Mitigation**: Use `rrule.js` library on client/server for parsing RFC 5545 rules

**Risk**: RLS performance on large datasets
**Mitigation**: Comprehensive indexing on `user_id` and time-based columns

**Risk**: Migration failure on existing database
**Mitigation**: Rollback script included, test on local instance first

**Risk**: Timezone handling complexity
**Mitigation**: Store all times in UTC, convert on client based on `schedules.timezone`

---

## Success Criteria

- ✅ All three tables created with proper schema
- ✅ RLS policies prevent cross-user access
- ✅ Indexes created for optimal query performance
- ✅ Old tables renamed with `_deprecated_` prefix
- ✅ Migration tested locally with rollback
- ✅ Schema documented with ER diagram
- ✅ All constraints validated

---

## Next Steps

After Story 1.10.2 completion:
- **Story 1.10.3**: TypeScript types and Supabase client integration
- **Story 1.10.4**: Database triggers for occurrence generation
- **Story 1.10.5**: Backend API routes for CRUD operations
