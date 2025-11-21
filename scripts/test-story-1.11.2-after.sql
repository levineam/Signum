-- Post-Migration Verification for Story 1.11.2: Add Missing Foreign Key Indexes
-- Purpose: Verify indexes added and query performance improved
-- Story: #180
-- Epic: 1.11 - Database Security & Performance Optimization

\echo '========================================================================='
\echo 'Story 1.11.2 - Post-Migration Verification'
\echo 'Verifying foreign key indexes added and performance improved'
\echo '========================================================================='
\echo ''

-- Enable timing to measure execution time
\timing on

-- Capture sample values so predicates exercise the FK columns we added indexes for
SELECT target_note_id FROM links WHERE target_note_id IS NOT NULL LIMIT 1 \gset
SELECT person_id FROM _deprecated_tasks WHERE person_id IS NOT NULL LIMIT 1 \gset
SELECT project_id FROM _deprecated_tasks WHERE project_id IS NOT NULL LIMIT 1 \gset
SELECT source_entry_id FROM _deprecated_tasks WHERE source_entry_id IS NOT NULL LIMIT 1 \gset
SELECT value_id FROM _deprecated_tasks WHERE value_id IS NOT NULL LIMIT 1 \gset

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

\echo '=== PART 1: Verify Indexes Exist ==='
\echo ''

\echo 'Checking idx_links_target_note_id...'
\di idx_links_target_note_id

\echo 'Checking idx_tasks_person_id...'
\di idx_tasks_person_id

\echo 'Checking idx_tasks_project_id...'
\di idx_tasks_project_id

\echo 'Checking idx_tasks_source_entry_id...'
\di idx_tasks_source_entry_id

\echo 'Checking idx_tasks_value_id...'
\di idx_tasks_value_id

\echo ''
\echo 'Expected: All 5 indexes should exist'
\echo ''

\echo '=== PART 2: Re-run Queries with EXPLAIN ANALYZE ==='
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
\echo 'Expected AFTER: Index Scan using idx_links_target_note_id'
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
\echo 'Expected AFTER: Index Scan using idx_tasks_person_id'
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
\echo 'Expected AFTER: Index Scan using idx_tasks_project_id'
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
\echo 'Expected AFTER: Index Scan using idx_tasks_source_entry_id'
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
\echo 'Expected AFTER: Index Scan using idx_tasks_value_id'
\echo ''

\echo '=== PART 3: Verify Index Usage Statistics ==='
\echo ''

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_links_target_note_id',
  'idx_tasks_person_id',
  'idx_tasks_project_id',
  'idx_tasks_source_entry_id',
  'idx_tasks_value_id'
)
ORDER BY indexname;

\echo ''
\echo 'Expected: All 5 indexes should show idx_scan > 0 when queries above run (if data exists)'
\echo ''

\echo '========================================================================='
\echo 'Post-migration verification complete!'
\echo ''
\echo 'Acceptance Criteria Checklist:'
\echo '[ ] All 5 indexes exist (verified with \di)'
\echo '[ ] Query 1 uses Index Scan on idx_links_target_note_id'
\echo '[ ] Query 2 uses Index Scan on idx_tasks_person_id'
\echo '[ ] Query 3 uses Index Scan on idx_tasks_project_id'
\echo '[ ] Query 4 uses Index Scan on idx_tasks_source_entry_id'
\echo '[ ] Query 5 uses Index Scan on idx_tasks_value_id'
\echo '[ ] All 5 indexes show idx_scan > 0 in pg_stat_user_indexes'
\echo '[ ] No query regressed by >10% (compare with before.sql times)'
\echo ''
\echo 'ACTION ITEMS:'
\echo '1. Save this output to: docs/analysis/perf-story-1.11.2-after-[date].txt'
\echo '2. Compare execution times with before.sql baseline'
\echo '3. Document performance improvements in perf report'
\echo '4. Run Supabase Linter and verify 0 unindexed foreign key warnings'
\echo '========================================================================='
