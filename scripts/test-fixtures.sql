-- Minimal fixtures to exercise Epic 1.11 verification scripts
-- Safe to run multiple times (idempotent, uses existence checks)
\echo '🌱 Seeding minimal fixtures for verification scripts...'

-- Ensure auth.uid() returns a known user for functions that rely on it
DO $$
DECLARE
  v_user uuid := '00000000-0000-0000-0000-0000000000aa';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
      INSERT INTO auth.users (id, email) VALUES (v_user, 'fixtures+epic111@example.com');
    END IF;
  END IF;
END;
$$;

-- Helper to insert only when table/columns exist
DO $$
DECLARE
  v_user uuid := '00000000-0000-0000-0000-0000000000aa';
  v_note uuid := '00000000-0000-0000-0000-0000000000ab';
  v_entity uuid := '00000000-0000-0000-0000-0000000000ac';
  v_task uuid := '00000000-0000-0000-0000-0000000000ad';
  v_entry uuid := '00000000-0000-0000-0000-0000000000ae';
BEGIN
  -- Notes table (for links target join)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notes'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM notes WHERE id = v_note) THEN
      EXECUTE 'INSERT INTO public.notes (id, user_id, title) VALUES ($1, $2, $3)'
      USING v_note, v_user, 'Fixture Note';
    END IF;
  END IF;

  -- Journal entries (for _deprecated_tasks source_entry_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'journal_entries'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE id = v_entry) THEN
      EXECUTE 'INSERT INTO public.journal_entries (id, user_id, content) VALUES ($1, $2, $3)'
      USING v_entry, v_user, 'Fixture journal entry';
    END IF;
  END IF;

  -- Entities (person/project/value targets)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'entities'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM entities WHERE id = v_entity) THEN
      EXECUTE 'INSERT INTO public.entities (id, user_id, entity_name, entity_type, centrality) VALUES ($1, $2, $3, $4, 0)'
      USING v_entity, v_user, 'Fixture Entity', 'concept';
    END IF;
  END IF;

  -- Links (for FK index coverage)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'target_note_id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM links WHERE target_note_id = v_note) THEN
      EXECUTE 'INSERT INTO public.links (user_id, target_note_id) VALUES ($1, $2)'
      USING v_user, v_note;
    END IF;
  END IF;

  -- _deprecated_tasks (for FK index coverage)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '_deprecated_tasks' AND column_name = 'person_id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM _deprecated_tasks WHERE person_id = v_entity) THEN
      EXECUTE '
        INSERT INTO public._deprecated_tasks (user_id, person_id, project_id, source_entry_id, value_id)
        VALUES ($1, $2, $2, $3, $2)
      ' USING v_user, v_entity, v_entry;
    END IF;
  END IF;

  -- Term frequencies seed (optional; function will upsert)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'term_frequencies' AND column_name = 'term'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM term_frequencies WHERE user_id = v_user AND term = 'test') THEN
      EXECUTE '
        INSERT INTO public.term_frequencies (user_id, term, count_alltime, count_this_week, count_last_week, last_updated)
        VALUES ($1, $2, 0, 0, 0, now())
      ' USING v_user, 'test';
    END IF;
  END IF;
END;
$$;

\echo '✅ Fixtures seeded (skipped inserts where tables/columns are missing)'
