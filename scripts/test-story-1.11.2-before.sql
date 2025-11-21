-- Pre-Migration Baseline for Story 1.11.2: Add Missing Foreign Key Indexes
-- Purpose: Capture query performance BEFORE adding indexes
-- Story: #180
-- Epic: 1.11 - Database Security & Performance Optimization

\echo '========================================================================='
\echo 'Story 1.11.2 - Pre-Migration Performance Baseline'
\echo 'Capturing query performance BEFORE adding foreign key indexes'
\echo '========================================================================='
\echo ''

-- Enable timing to measure execution time
\timing on

-- Capture sample values so predicates exercise the FK columns we’re indexing
SELECT target_note_id FROM links WHERE target_note_id IS NOT NULL LIMIT 1 \gset
SELECT person_id FROM _deprecated_tasks WHERE person_id IS NOT NULL LIMIT 1 \gset
SELECT project_id FROM _deprecated_tasks WHERE project_id IS NOT NULL LIMIT 1 \gset
SELECT source_entry_id FROM _deprecated_tasks WHERE source_entry_id IS NOT NULL LIMIT 1 \gset
SELECT value_id FROM _deprecated_tasks WHERE value_id IS NOT NULL LIMIT 1 \gset

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

\echo ''
\echo '=== Query 1: links JOIN notes (target_note_id) ==='
\if :{?target_note_id}
  \echo 'Using target_note_id=:target_note_id'
  EXPLAIN ANALYZE
  SELECT l.*, n.title FROM links l
  JOIN notes n ON l.target_note_id = n.id
  WHERE l.user_id = :test_user_id::uuid
  AND l.target_note_id = :'target_note_id'::uuid
  LIMIT 100;
\else
  \echo 'SKIP Query 1: no links.target_note_id rows found to exercise index'
\endif

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on links or notes (no index on target_note_id)'
\echo ''

\echo '=== Query 2: _deprecated_tasks JOIN entities (person_id) ==='
\if :{?person_id}
  \echo 'Using person_id=:person_id'
  EXPLAIN ANALYZE
  SELECT t.*, e.entity_name FROM _deprecated_tasks t
  JOIN entities e ON t.person_id = e.id
  WHERE t.user_id = :test_user_id::uuid
  AND t.person_id = :'person_id'::uuid
  LIMIT 100;
\else
  \echo 'SKIP Query 2: no _deprecated_tasks.person_id rows found to exercise index'
\endif

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or entities (no index on person_id)'
\echo ''

\echo '=== Query 3: _deprecated_tasks JOIN entities (project_id) ==='
\if :{?project_id}
  \echo 'Using project_id=:project_id'
  EXPLAIN ANALYZE
  SELECT t.*, e.entity_name FROM _deprecated_tasks t
  JOIN entities e ON t.project_id = e.id
  WHERE t.user_id = :test_user_id::uuid
  AND t.project_id = :'project_id'::uuid
  LIMIT 100;
\else
  \echo 'SKIP Query 3: no _deprecated_tasks.project_id rows found to exercise index'
\endif

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or entities (no index on project_id)'
\echo ''

\echo '=== Query 4: _deprecated_tasks JOIN journal_entries (source_entry_id) ==='
\if :{?source_entry_id}
  \echo 'Using source_entry_id=:source_entry_id'
  EXPLAIN ANALYZE
  SELECT t.*, j.content FROM _deprecated_tasks t
  JOIN journal_entries j ON t.source_entry_id = j.id
  WHERE t.user_id = :test_user_id::uuid
  AND t.source_entry_id = :'source_entry_id'::uuid
  LIMIT 100;
\else
  \echo 'SKIP Query 4: no _deprecated_tasks.source_entry_id rows found to exercise index'
\endif

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or journal_entries (no index on source_entry_id)'
\echo ''

\echo '=== Query 5: _deprecated_tasks JOIN entities (value_id) ==='
\if :{?value_id}
  \echo 'Using value_id=:value_id'
  EXPLAIN ANALYZE
  SELECT t.*, e.entity_name FROM _deprecated_tasks t
  JOIN entities e ON t.value_id = e.id
  WHERE t.user_id = :test_user_id::uuid
  AND t.value_id = :'value_id'::uuid
  LIMIT 100;
\else
  \echo 'SKIP Query 5: no _deprecated_tasks.value_id rows found to exercise index'
\endif

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or entities (no index on value_id)'
\echo ''

\echo '========================================================================='
\echo 'Baseline capture complete!'
\echo ''
\echo 'ACTION ITEMS:'
\echo '1. Save this output to: docs/analysis/perf-story-1.11.2-before-[date].txt'
\echo '2. Note execution times for each query'
\echo '3. Note query plan types (Seq Scan vs Index Scan)'
\echo '4. Run migration to add indexes'
\echo '5. Run test-story-1.11.2-after.sql'
\echo '6. Compare results'
\echo '========================================================================='
