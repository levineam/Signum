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
  FOREACH issues IN ARRAY ARRAY[]::text[] LOOP END LOOP; -- placeholder to keep array type consistent
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'links') THEN
    issues := array_append(issues, 'table links');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = '_deprecated_tasks') THEN
    issues := array_append(issues, 'table _deprecated_tasks');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'notes') THEN
    issues := array_append(issues, 'table notes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'journal_entries') THEN
    issues := array_append(issues, 'table journal_entries');
  END IF;

  -- Indexes required for FK verification
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_links_target_note_id') THEN
    issues := array_append(issues, 'index idx_links_target_note_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_person_id') THEN
    issues := array_append(issues, 'index idx_tasks_person_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_project_id') THEN
    issues := array_append(issues, 'index idx_tasks_project_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_source_entry_id') THEN
    issues := array_append(issues, 'index idx_tasks_source_entry_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tasks_value_id') THEN
    issues := array_append(issues, 'index idx_tasks_value_id');
  END IF;

  IF array_length(issues, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Schema validation failed. Missing or mismatched: %', issues;
  END IF;
END;
$$;

\echo '✅ Schema validation passed for verification scripts'
