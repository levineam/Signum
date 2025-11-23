-- Epic 1.11 Story 1.11.3: Clean Up Unused Database Indexes
-- Purpose: Remove unused indexes to reduce storage overhead and improve write performance
-- References: Epic 1.11 - Database Security & Performance Optimization
-- Story: https://github.com/levineam/Signum/issues/181
--
-- Analysis Date: 2025-11-22
-- Total Unused Indexes: 16 (idx_scan = 0, excluding unique constraints)
-- Total Storage Reclaimed: ~1.6 MB
-- Note: Preserved 3 unique constraints (all required for write operations):
--       - unique_user_term (enables increment_term_frequency ON CONFLICT)
--       - unique_user_type_name (prevents duplicate entities, Story 1.1)
--       - unique_user_content_hash (enables embeddings upsert ON CONFLICT)
--
-- IMPORTANT: These indexes have ZERO scans in production. Safe to drop.
-- If performance regresses, indexes can be recreated using CREATE INDEX CONCURRENTLY.

-- ============================================================================
-- Drop Unused Indexes (idx_scan = 0)
-- ============================================================================

-- paragraph_embeddings (2 indexes, 1.6 MB total)
-- NOTE: unique_user_content_hash MUST be kept - required for embeddings upsert (see src/utils/nlp/embeddings.ts:60)
-- DROP CONSTRAINT unique_user_content_hash;  -- ❌ CANNOT DROP - enables onConflict: 'user_id,content_hash' upsert
DROP INDEX IF EXISTS idx_paragraph_embeddings_vector;        -- 1608 kB, 0 scans
DROP INDEX IF EXISTS idx_paragraph_embeddings_hash;          -- 8 kB, 0 scans

-- tasks (2 indexes, 32 kB total)
DROP INDEX IF EXISTS idx_tasks_user_due;                     -- 16 kB, 0 scans
DROP INDEX IF EXISTS idx_tasks_is_query;                     -- 16 kB, 0 scans

-- links (2 indexes, 32 kB total)
ALTER TABLE IF EXISTS links DROP CONSTRAINT IF EXISTS links_source_note_id_target_note_id_link_type_key;  -- drops backing index
DROP INDEX IF EXISTS idx_links_user_source;                  -- 16 kB, 0 scans

-- reminders (1 index, 16 kB)
DROP INDEX IF EXISTS idx_reminders_user;                     -- 16 kB, 0 scans

-- ontology_updates (1 index, 16 kB)
DROP INDEX IF EXISTS idx_ontology_updates_created;           -- 16 kB, 0 scans

-- helper_usage (1 index, 16 kB)
DROP INDEX IF EXISTS idx_helper_usage_helper_type;           -- 16 kB, 0 scans

-- journal_templates (1 index, 8 kB)
DROP INDEX IF EXISTS idx_journal_templates_user_id;          -- 8 kB, 0 scans

-- entities (2 indexes, 16 kB total)
-- NOTE: unique_user_type_name MUST be kept - prevents duplicate entities during concurrent upserts (Story 1.1)
-- DROP CONSTRAINT unique_user_type_name;  -- ❌ CANNOT DROP - enforces uniqueness for (user_id, type, name)
DROP INDEX IF EXISTS idx_entities_user_type;                 -- 8 kB, 0 scans
DROP INDEX IF EXISTS idx_entities_centrality;                -- 8 kB, 0 scans

-- meters_daily (1 index, 8 kB)
DROP INDEX IF EXISTS idx_meters_daily_user_date;             -- 8 kB, 0 scans

-- term_frequencies (2 indexes, 16 kB total)
-- NOTE: unique_user_term MUST be kept - required by increment_term_frequency function's ON CONFLICT clause
-- DROP INDEX IF EXISTS unique_user_term;  -- ❌ CANNOT DROP - breaks increment_term_frequency function
DROP INDEX IF EXISTS idx_term_freq_user_term;                -- 8 kB, 0 scans (redundant with unique_user_term)
DROP INDEX IF EXISTS idx_term_freq_user_alltime;             -- 8 kB, 0 scans

-- journal_entries (1 index, 8 kB)
DROP INDEX IF EXISTS idx_journal_entries_created_at;         -- 8 kB, 0 scans

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify all 16 indexes were dropped (3 unique constraints preserved)
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
  -- 'unique_user_type_name',  -- Kept to prevent duplicate entities (Story 1.1)
  'idx_meters_daily_user_date',
  -- 'unique_user_term',  -- Kept for increment_term_frequency function
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  -- 'unique_user_content_hash',  -- Kept for embeddings upsert
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at'
);
-- Expected: remaining_unused_indexes = 0, index_names = NULL

\echo '✅ Epic 1.11 Story 1.11.3: Dropped 16 unused indexes (~1.6 MB reclaimed, preserved 3 unique constraints)'
