-- Epic 1.11 Story 1.11.2: Add Missing Foreign Key Indexes
-- Purpose: Improve performance on foreign key column queries
-- References: Epic 1.11 - Database Security & Performance Optimization
-- Story: https://github.com/levineam/Signum/issues/180

-- ============================================================================
-- Foreign Key Indexes for links table
-- ============================================================================

-- Index on links.target_note_id for JOIN operations with notes table
CREATE INDEX IF NOT EXISTS idx_links_target_note_id
  ON links(target_note_id)
  WHERE target_note_id IS NOT NULL;

-- ============================================================================
-- Foreign Key Indexes for _deprecated_tasks table
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_deprecated_tasks'
  ) THEN
    -- Index on _deprecated_tasks.person_id for JOIN operations with entities table
    CREATE INDEX IF NOT EXISTS idx_tasks_person_id
      ON _deprecated_tasks(person_id)
      WHERE person_id IS NOT NULL;

    -- Index on _deprecated_tasks.project_id for JOIN operations with entities table
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id
      ON _deprecated_tasks(project_id)
      WHERE project_id IS NOT NULL;

    -- Index on _deprecated_tasks.source_entry_id for JOIN operations with journal_entries table
    CREATE INDEX IF NOT EXISTS idx_tasks_source_entry_id
      ON _deprecated_tasks(source_entry_id)
      WHERE source_entry_id IS NOT NULL;

    -- Index on _deprecated_tasks.value_id for JOIN operations with entities table
    CREATE INDEX IF NOT EXISTS idx_tasks_value_id
      ON _deprecated_tasks(value_id)
      WHERE value_id IS NOT NULL;
  ELSE
    RAISE NOTICE '_deprecated_tasks not present; skipping legacy FK indexes';
  END IF;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify all 5 indexes were created
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname IN (
  'idx_links_target_note_id',
  'idx_tasks_person_id',
  'idx_tasks_project_id',
  'idx_tasks_source_entry_id',
  'idx_tasks_value_id'
)
ORDER BY indexname;
