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

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

\echo ''
\echo '=== Query 1: links JOIN notes (target_note_id) ==='
EXPLAIN ANALYZE
SELECT l.*, n.title FROM links l
JOIN notes n ON l.target_note_id = n.id
WHERE l.user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on links or notes (no index on target_note_id)'
\echo ''

\echo '=== Query 2: _deprecated_tasks JOIN entities (person_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM _deprecated_tasks t
JOIN entities e ON t.person_id = e.id
WHERE t.user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or entities (no index on person_id)'
\echo ''

\echo '=== Query 3: _deprecated_tasks JOIN entities (project_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM _deprecated_tasks t
JOIN entities e ON t.project_id = e.id
WHERE t.user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or entities (no index on project_id)'
\echo ''

\echo '=== Query 4: _deprecated_tasks JOIN journal_entries (source_entry_id) ==='
EXPLAIN ANALYZE
SELECT t.*, j.content FROM _deprecated_tasks t
JOIN journal_entries j ON t.source_entry_id = j.id
WHERE t.user_id = :test_user_id::uuid
LIMIT 100;

\echo ''
\echo 'Expected BEFORE: Likely Seq Scan on tasks or journal_entries (no index on source_entry_id)'
\echo ''

\echo '=== Query 5: _deprecated_tasks JOIN entities (value_id) ==='
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM _deprecated_tasks t
JOIN entities e ON t.value_id = e.id
WHERE t.user_id = :test_user_id::uuid
LIMIT 100;

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
