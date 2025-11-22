-- Epic 1.11 Story 1.11.3: Clean Up Unused Database Indexes
-- Purpose: Remove unused indexes to reduce storage overhead and improve write performance
-- References: Epic 1.11 - Database Security & Performance Optimization
-- Story: https://github.com/levineam/Signum/issues/181
--
-- Analysis Date: 2025-11-22
-- Total Unused Indexes: 19 (idx_scan = 0)
-- Total Storage Reclaimed: ~1.7 MB
--
-- IMPORTANT: These indexes have ZERO scans in production. Safe to drop.
-- If performance regresses, indexes can be recreated using CREATE INDEX CONCURRENTLY.

-- ============================================================================
-- Drop Unused Indexes (idx_scan = 0)
-- ============================================================================

-- paragraph_embeddings (3 indexes, 1.6 MB total)
DROP INDEX IF EXISTS idx_paragraph_embeddings_vector;        -- 1608 kB, 0 scans
DROP INDEX IF EXISTS unique_user_content_hash;               -- 8 kB, 0 scans
DROP INDEX IF EXISTS idx_paragraph_embeddings_hash;          -- 8 kB, 0 scans

-- tasks (2 indexes, 32 kB total)
DROP INDEX IF EXISTS idx_tasks_user_due;                     -- 16 kB, 0 scans
DROP INDEX IF EXISTS idx_tasks_is_query;                     -- 16 kB, 0 scans

-- links (2 indexes, 32 kB total)
DROP INDEX IF EXISTS links_source_note_id_target_note_id_link_type_key;  -- 16 kB, 0 scans (UNIQUE constraint index)
DROP INDEX IF EXISTS idx_links_user_source;                  -- 16 kB, 0 scans

-- reminders (1 index, 16 kB)
DROP INDEX IF EXISTS idx_reminders_user;                     -- 16 kB, 0 scans

-- ontology_updates (1 index, 16 kB)
DROP INDEX IF EXISTS idx_ontology_updates_created;           -- 16 kB, 0 scans

-- helper_usage (1 index, 16 kB)
DROP INDEX IF EXISTS idx_helper_usage_helper_type;           -- 16 kB, 0 scans

-- journal_templates (1 index, 8 kB)
DROP INDEX IF EXISTS idx_journal_templates_user_id;          -- 8 kB, 0 scans

-- entities (3 indexes, 24 kB total)
DROP INDEX IF EXISTS idx_entities_user_type;                 -- 8 kB, 0 scans
DROP INDEX IF EXISTS idx_entities_centrality;                -- 8 kB, 0 scans
DROP INDEX IF EXISTS unique_user_type_name;                  -- 8 kB, 0 scans (UNIQUE constraint index)

-- meters_daily (1 index, 8 kB)
DROP INDEX IF EXISTS idx_meters_daily_user_date;             -- 8 kB, 0 scans

-- term_frequencies (3 indexes, 24 kB total)
DROP INDEX IF EXISTS unique_user_term;                       -- 8 kB, 0 scans (UNIQUE constraint index)
DROP INDEX IF EXISTS idx_term_freq_user_term;                -- 8 kB, 0 scans
DROP INDEX IF EXISTS idx_term_freq_user_alltime;             -- 8 kB, 0 scans

-- journal_entries (1 index, 8 kB)
DROP INDEX IF EXISTS idx_journal_entries_created_at;         -- 8 kB, 0 scans

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify all 19 indexes were dropped
SELECT
  COUNT(*) as remaining_unused_indexes,
  string_agg(indexname, ', ') as index_names
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_paragraph_embeddings_vector',
  'idx_tasks_user_due',
  'idx_tasks_is_query',
  'idx_reminders_user',
  'idx_ontology_updates_created',
  'idx_helper_usage_helper_type',
  'links_source_note_id_target_note_id_link_type_key',
  'idx_links_user_source',
  'idx_journal_templates_user_id',
  'idx_entities_user_type',
  'idx_entities_centrality',
  'unique_user_type_name',
  'idx_meters_daily_user_date',
  'unique_user_term',
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  'unique_user_content_hash',
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at'
);
-- Expected: remaining_unused_indexes = 0, index_names = NULL

\echo '✅ Epic 1.11 Story 1.11.3: Dropped 19 unused indexes (~1.7 MB reclaimed)'
