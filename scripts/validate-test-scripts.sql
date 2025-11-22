-- Validate that verification scripts align with the current schema
-- Fails if required functions/indexes/tables are missing or have wrong arity
\echo '🔍 Running schema validation for verification scripts...'

DO $$
DECLARE
  issues text[] := '{}';
BEGIN
  -- Functions (arity-sensitive)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_entity_centrality'
      AND p.pronargs = 1
  ) THEN
    issues := array_append(issues, 'function increment_entity_centrality(uuid)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_term_frequency'
      AND p.pronargs = 2
  ) THEN
    issues := array_append(issues, 'function increment_term_frequency(text, int)');
  END IF;

  -- Tables referenced by verification scripts

  -- Core Phase 2 tables (required)
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'items') THEN
    issues := array_append(issues, 'table items');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'schedules') THEN
    issues := array_append(issues, 'table schedules');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'occurrences') THEN
    issues := array_append(issues, 'table occurrences');
  END IF;

  -- Optional legacy tables (checked for backward compatibility but not required)
  -- Only present if old tasks/reminders tables existed before Phase 2 migration
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'links') THEN
    issues := array_append(issues, 'table links');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'notes') THEN
    issues := array_append(issues, 'table notes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'journal_entries') THEN
    issues := array_append(issues, 'table journal_entries');
  END IF;

  -- Indexes on legacy/deprecated tables (optional, only check if tables exist)
  -- These are only relevant if old schema tables were migrated to _deprecated_* versions
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'links') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_links_target_note_id') THEN
      issues := array_append(issues, 'index idx_links_target_note_id (on links table)');
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = '_deprecated_tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_person_id') THEN
      issues := array_append(issues, 'index idx_tasks_person_id (on _deprecated_tasks table)');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_project_id') THEN
      issues := array_append(issues, 'index idx_tasks_project_id (on _deprecated_tasks table)');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_source_entry_id') THEN
      issues := array_append(issues, 'index idx_tasks_source_entry_id (on _deprecated_tasks table)');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_value_id') THEN
      issues := array_append(issues, 'index idx_tasks_value_id (on _deprecated_tasks table)');
    END IF;
  END IF;

  IF array_length(issues, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Schema validation failed. Missing or mismatched: %', issues;
  END IF;
END;
$$;

\echo '✅ Schema validation passed for verification scripts'
