-- Pre-Migration Baseline for Story 1.11.3: Clean Up Unused Database Indexes
-- Purpose: Capture query performance BEFORE removing unused indexes
-- Story: #181
-- Epic: 1.11 - Database Security & Performance Optimization

\echo '========================================================================='
\echo 'Story 1.11.3 - Pre-Migration Performance Baseline'
\echo 'Capturing query performance BEFORE removing 16 unused indexes'
\echo '========================================================================='
\echo ''

-- Enable timing to measure execution time
\timing on

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

\echo ''
\echo '=== Query 1: helper_usage by type ==='
EXPLAIN ANALYZE
SELECT * FROM helper_usage
WHERE helper_type = 'gratitude'
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 2: _deprecated_tasks by user and due date ==='
EXPLAIN ANALYZE
SELECT * FROM _deprecated_tasks
WHERE user_id = :test_user_id::uuid
AND due_at < NOW()
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 3: entities by user and type ==='
EXPLAIN ANALYZE
SELECT * FROM entities
WHERE user_id = :test_user_id::uuid
AND entity_type = 'person'
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 4: reminders by user ==='
EXPLAIN ANALYZE
SELECT * FROM reminders
WHERE user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 5: meters_daily by user and date ==='
EXPLAIN ANALYZE
SELECT * FROM meters_daily
WHERE user_id = :test_user_id::uuid
AND date = CURRENT_DATE;

\echo ''
\echo ''
\echo '=== Query 6: term_frequencies by user and term ==='
EXPLAIN ANALYZE
SELECT * FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test'
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 7: paragraph_embeddings by hash ==='
EXPLAIN ANALYZE
SELECT * FROM paragraph_embeddings
WHERE content_hash = 'test-hash'
LIMIT 1;

\echo ''
\echo ''
\echo '=== Query 8: journal_entries by created_at ==='
EXPLAIN ANALYZE
SELECT * FROM journal_entries
WHERE user_id = :test_user_id::uuid
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo ''
\echo '=== Query 9: links by user ==='
EXPLAIN ANALYZE
SELECT * FROM links
WHERE user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo ''
\echo '=== Query 10: ontology_updates by created ==='
EXPLAIN ANALYZE
SELECT * FROM ontology_updates
WHERE user_id = :test_user_id::uuid
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo '========================================================================='
\echo 'Baseline capture complete!'
\echo ''
\echo 'ACTION ITEMS:'
\echo '1. Save this output to: docs/analysis/perf-story-1.11.3-before-[date].txt'
\echo '2. Document execution times for each query'
\echo '3. Document query plans (note any Index Scans)'
\echo '4. Run migration to drop unused indexes'
\echo '5. Run test-story-1.11.3-after.sql'
\echo '6. Verify no Index→Seq Scan regressions'
\echo '7. Verify no execution time regression >10%'
\echo '========================================================================='
