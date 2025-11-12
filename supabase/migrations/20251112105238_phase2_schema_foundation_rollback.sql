-- Rollback Phase 2 Schema Foundation
-- Epic 1.10, Story 1.10.2
-- Drops schedules, items, and occurrences tables and restores old schema

-- ============================================================================
-- 1. Drop Tables (in reverse order of creation)
-- ============================================================================

DROP TABLE IF EXISTS occurrences CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;

-- ============================================================================
-- 2. Drop Custom Types (ENUMs)
-- ============================================================================

DROP TYPE IF EXISTS priority_level;
DROP TYPE IF EXISTS item_status;
DROP TYPE IF EXISTS item_type;

-- ============================================================================
-- 3. Restore Old Tables (if renamed)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_deprecated_tasks') THEN
    ALTER TABLE _deprecated_tasks RENAME TO tasks;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_deprecated_reminders') THEN
    ALTER TABLE _deprecated_reminders RENAME TO reminders;
  END IF;
END $$;

-- ============================================================================
-- 4. Notes
-- ============================================================================

-- Note: update_updated_at_column() function is left in place as it may be used
-- by other tables. If you want to remove it completely, uncomment below:

-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
