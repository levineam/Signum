-- Drop unused indexes identified in Story 1.11.3
-- Safe to rerun: uses IF EXISTS
SET search_path = public;

DROP INDEX IF EXISTS idx_helper_usage_helper_type;
DROP INDEX IF EXISTS idx_tasks_user_due;
DROP INDEX IF EXISTS idx_tasks_is_query;
DROP INDEX IF EXISTS idx_entities_user_type;
DROP INDEX IF EXISTS idx_entities_centrality;
DROP INDEX IF EXISTS idx_reminders_user;
DROP INDEX IF EXISTS idx_meters_daily_user_date;
DROP INDEX IF EXISTS idx_term_freq_user_term;
DROP INDEX IF EXISTS idx_term_freq_user_alltime;
DROP INDEX IF EXISTS idx_paragraph_embeddings_vector;
DROP INDEX IF EXISTS idx_paragraph_embeddings_hash;
DROP INDEX IF EXISTS idx_journal_entries_created_at;
DROP INDEX IF EXISTS idx_journal_templates_user_id;
DROP INDEX IF EXISTS idx_links_user;
DROP INDEX IF EXISTS idx_links_user_source;
DROP INDEX IF EXISTS idx_ontology_updates_created;
