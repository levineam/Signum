-- Index Usage Verification for Story 1.11.3: Clean Up Unused Database Indexes
-- Purpose: Verify 16 indexes are truly unused before removal
-- Story: #181
-- Epic: 1.11 - Database Security & Performance Optimization

\echo '========================================================================='
\echo 'Story 1.11.3 - Verify Unused Indexes'
\echo 'Confirming 16 indexes have idx_scan = 0 (unused)'
\echo '========================================================================='
\echo ''

-- Query index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE indexname IN (
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
)
ORDER BY tablename, indexname;

\echo ''
\echo 'Expected: All 16 indexes should show idx_scan = 0'
\echo ''

-- Calculate total storage to be reclaimed
\echo '=== Total Storage to be Reclaimed ==='
SELECT
  COUNT(*) as index_count,
  pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size
FROM pg_stat_user_indexes
WHERE indexname IN (
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
\echo '========================================================================='
\echo 'Verification complete!'
\echo ''
\echo 'Acceptance Criteria:'
\echo '[ ] All 16 indexes show idx_scan = 0'
\echo '[ ] Usage window confirmed (database has been running ≥7 days)'
\echo ''
\echo 'ACTION ITEMS:'
\echo '1. Save this output to: docs/analysis/unused-indexes-report-story-1.11.3-[date].md'
\echo '2. Confirm usage window (how long has production been running?)'
\echo '3. If all idx_scan = 0, proceed with test-story-1.11.3-before.sql'
\echo '4. If any idx_scan > 0, DO NOT DROP that index - investigate usage first'
\echo '========================================================================='
