-- Post-Migration Verification for Story 1.11.3: Clean Up Unused Database Indexes
-- Purpose: Verify indexes removed and no query performance regression
-- Story: #181
-- Epic: 1.11 - Database Security & Performance Optimization

\echo '========================================================================='
\echo 'Story 1.11.3 - Post-Migration Verification'
\echo 'Verifying 16 unused indexes removed without performance regression'
\echo '========================================================================='
\echo ''

-- Enable timing to measure execution time
\timing on

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

\echo '=== PART 1: Verify Indexes Dropped ==='
\echo ''

SELECT
  'Indexes still exist:' as status,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_helper_usage_helper_type',
  'idx_tasks_user_due',
  'idx_tasks_is_query',
  'idx_entities_user_type',
  'idx_entities_centrality',
  'idx_reminders_user',
  'idx_meters_daily_user_date',
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  'idx_paragraph_embeddings_vector',
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at',
  'idx_journal_templates_user_id',
  'idx_links_user',
  'idx_links_user_source',
  'idx_ontology_updates_created'
);

\echo ''
\echo 'Expected: count = 0 (all indexes dropped)'
\echo ''

-- List any that still exist (for debugging)
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_helper_usage_helper_type',
  'idx_tasks_user_due',
  'idx_tasks_is_query',
  'idx_entities_user_type',
  'idx_entities_centrality',
  'idx_reminders_user',
  'idx_meters_daily_user_date',
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  'idx_paragraph_embeddings_vector',
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at',
  'idx_journal_templates_user_id',
  'idx_links_user',
  'idx_links_user_source',
  'idx_ontology_updates_created'
);

\echo ''
\echo '=== PART 2: Re-run Queries with EXPLAIN ANALYZE ==='
\echo ''

\echo '=== Query 1: helper_usage by type ==='
EXPLAIN ANALYZE
SELECT * FROM helper_usage
WHERE helper_type = 'gratitude'
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before (should NOT have changed to Seq Scan)'
\echo ''

\echo '=== Query 2: _deprecated_tasks by user and due date ==='
EXPLAIN ANALYZE
SELECT * FROM _deprecated_tasks
WHERE user_id = :test_user_id::uuid
AND due_at < NOW()
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 3: entities by user and type ==='
EXPLAIN ANALYZE
SELECT * FROM entities
WHERE user_id = :test_user_id::uuid
AND entity_type = 'person'
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 4: reminders by user ==='
EXPLAIN ANALYZE
SELECT * FROM reminders
WHERE user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 5: meters_daily by user and date ==='
EXPLAIN ANALYZE
SELECT * FROM meters_daily
WHERE user_id = :test_user_id::uuid
AND date = CURRENT_DATE;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 6: term_frequencies by user and term ==='
EXPLAIN ANALYZE
SELECT * FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test'
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 7: paragraph_embeddings by hash ==='
EXPLAIN ANALYZE
SELECT * FROM paragraph_embeddings
WHERE content_hash = 'test-hash'
LIMIT 1;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 8: journal_entries by created_at ==='
EXPLAIN ANALYZE
SELECT * FROM journal_entries
WHERE user_id = :test_user_id::uuid
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 9: links by user ==='
EXPLAIN ANALYZE
SELECT * FROM links
WHERE user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '=== Query 10: ontology_updates by created ==='
EXPLAIN ANALYZE
SELECT * FROM ontology_updates
WHERE user_id = :test_user_id::uuid
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo 'Expected: Same plan as before'
\echo ''

\echo '========================================================================='
\echo 'Post-migration verification complete!'
\echo ''
\echo 'Acceptance Criteria Checklist:'
\echo '[ ] All 16 indexes confirmed dropped (count = 0)'
\echo '[ ] No query plan changed from Index Scan → Seq Scan'
\echo '[ ] No query execution time regressed by >10%'
\echo '[ ] Proceed to application smoke test'
\echo ''
\echo 'ACTION ITEMS:'
\echo '1. Save this output to: docs/analysis/perf-story-1.11.3-after-[date].txt'
\echo '2. Compare query plans with before.sql baseline'
\echo '3. Compare execution times with before.sql baseline'
\echo '4. Run application smoke test (see epic doc Step 4)'
\echo '5. Run Supabase Linter and verify 0 unused index warnings'
\echo '6. Document results in perf report'
\echo '========================================================================='
