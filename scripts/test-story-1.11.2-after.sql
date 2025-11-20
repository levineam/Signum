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

-- Set test user (use first available user)
\set test_user_id (SELECT id FROM auth.users LIMIT 1)

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
EXPLAIN ANALYZE
SELECT l.*, n.title FROM links l
JOIN notes n ON l.target_note_id = n.id
WHERE l.user_id = :'test_user_id'::uuid
LIMIT 100;

\echo ''
\echo 'Expected AFTER: Index Scan using idx_links_target_note_id'
\echo ''

\echo '=== Query 2: tasks JOIN entities (person_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.person_id = e.id
WHERE t.user_id = :'test_user_id'::uuid
LIMIT 100;

\echo ''
\echo 'Expected AFTER: Index Scan using idx_tasks_person_id'
\echo ''

\echo '=== Query 3: tasks JOIN entities (project_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.project_id = e.id
WHERE t.user_id = :'test_user_id'::uuid
LIMIT 100;

\echo ''
\echo 'Expected AFTER: Index Scan using idx_tasks_project_id'
\echo ''

\echo '=== Query 4: tasks JOIN journal_entries (source_entry_id) ==='
EXPLAIN ANALYZE
SELECT t.*, j.content FROM tasks t
JOIN journal_entries j ON t.source_entry_id = j.id
WHERE t.user_id = :'test_user_id'::uuid
LIMIT 100;

\echo ''
\echo 'Expected AFTER: Index Scan using idx_tasks_source_entry_id'
\echo ''

\echo '=== Query 5: tasks JOIN entities (value_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.value_id = e.id
WHERE t.user_id = :'test_user_id'::uuid
LIMIT 100;

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
\echo 'Expected: All 5 indexes should show idx_scan > 0 (used by queries above)'
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
