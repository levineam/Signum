-- Phase 2 Schema Foundation: Unified Tasks & Reminders System
-- Epic 1.10, Story 1.10.2
-- Creates schedules, items, and occurrences tables per PRD spec

-- ============================================================================
-- 1. Helper Functions
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Custom Types (ENUMs)
-- ============================================================================

CREATE TYPE item_type AS ENUM ('task', 'reminder');
CREATE TYPE item_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- ============================================================================
-- 3. Schedules Table (RFC 5545 Recurrence Rules)
-- ============================================================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recurrence rule (RFC 5545 format)
  -- Example: "FREQ=DAILY;INTERVAL=1;UNTIL=20251231T235959Z"
  rrule TEXT NOT NULL,

  -- Timezone for recurrence calculation (IANA timezone)
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

-- Indexes for schedules
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_rrule ON schedules USING gin(to_tsvector('simple', rrule));

-- RLS Policies for schedules
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

-- Trigger for schedules updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Items Table (Tasks and Reminders)
-- ============================================================================

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

  -- Metadata (extensible JSON for future fields)
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
    (schedule_id IS NULL AND due_at IS NOT NULL) OR  -- One-time with due date
    (schedule_id IS NOT NULL) OR                     -- Recurring
    (schedule_id IS NULL AND due_at IS NULL)         -- No due date (reminder only)
  )
);

-- Indexes for items
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

-- RLS Policies for items
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

-- Trigger for items updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Occurrences Table (Materialized Recurring Instances)
-- ============================================================================

CREATE TABLE occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  -- Occurrence details
  scheduled_at TIMESTAMPTZ NOT NULL, -- When this occurrence is scheduled

  -- Instance-specific overrides (nullable = inherit from parent item)
  title TEXT, -- Override parent item title
  description TEXT, -- Override parent item description
  due_at TIMESTAMPTZ, -- Override parent item due_at
  reminder_time TIMESTAMPTZ, -- Override parent item reminder_time

  -- Status (per-instance)
  status item_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Skip flag (for skipped recurring instances)
  is_skipped BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata (extensible JSON for future fields)
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

-- Indexes for occurrences
CREATE INDEX idx_occurrences_user_id ON occurrences(user_id);
CREATE INDEX idx_occurrences_item_id ON occurrences(item_id);
CREATE INDEX idx_occurrences_scheduled_at ON occurrences(scheduled_at);
CREATE INDEX idx_occurrences_status ON occurrences(status);

-- Optimized index for "show pending occurrences" queries
CREATE INDEX idx_occurrences_pending ON occurrences(scheduled_at, status)
  WHERE status = 'pending' AND is_skipped = FALSE;

-- RLS Policies for occurrences
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

-- Trigger for occurrences updated_at
CREATE TRIGGER update_occurrences_updated_at
  BEFORE UPDATE ON occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Deprecate Old Tables
-- ============================================================================

-- Rename old tables for historical reference (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    ALTER TABLE tasks RENAME TO _deprecated_tasks;

    COMMENT ON TABLE _deprecated_tasks IS
      'DEPRECATED: Replaced by items/schedules/occurrences schema in Epic 1.10 (Story 1.10.2).
       Preserved for historical reference. Safe to drop after 2025-12-31.';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
    ALTER TABLE reminders RENAME TO _deprecated_reminders;

    COMMENT ON TABLE _deprecated_reminders IS
      'DEPRECATED: Replaced by items/schedules/occurrences schema in Epic 1.10 (Story 1.10.2).
       Preserved for historical reference. Safe to drop after 2025-12-31.';
  END IF;
END $$;

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE schedules IS
  'Defines recurrence patterns using RFC 5545 (iCalendar) RRULE format.
   Used for recurring tasks and reminders.';

COMMENT ON TABLE items IS
  'Individual tasks and reminders. Can be one-time (due_at) or recurring (schedule_id).
   Contains all item-specific fields like title, description, priority, etc.';

COMMENT ON TABLE occurrences IS
  'Materialized instances of recurring items for efficient querying.
   Each occurrence represents a specific date/time for a recurring item.
   Supports per-instance overrides and status tracking.';

COMMENT ON COLUMN schedules.rrule IS
  'RFC 5545 recurrence rule. Example: "FREQ=DAILY;INTERVAL=1;UNTIL=20251231T235959Z"';

COMMENT ON COLUMN schedules.exception_dates IS
  'Array of dates to exclude from recurrence. Example: ["2025-11-25", "2025-12-25"]';

COMMENT ON COLUMN items.schedule_id IS
  'Foreign key to schedules table. NULL for one-time items.';

COMMENT ON COLUMN items.due_at IS
  'Due date/time for one-time items. For recurring items, this is the default due time.';

COMMENT ON COLUMN occurrences.scheduled_at IS
  'The date/time this occurrence is scheduled for. Generated from parent schedule RRULE.';

COMMENT ON COLUMN occurrences.is_skipped IS
  'TRUE if user explicitly skipped this occurrence. Different from cancelled.';
