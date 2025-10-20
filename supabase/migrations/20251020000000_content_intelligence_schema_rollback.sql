-- Rollback for Story 1.1: Core NLP Infrastructure & Database Schema
-- Drops all tables created in 20251020000000_content_intelligence_schema.sql

-- ============================================================================
-- Drop tables in reverse order (respecting FK dependencies)
-- ============================================================================

DROP TABLE IF EXISTS paragraph_embeddings CASCADE;
DROP TABLE IF EXISTS meters_daily CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS term_frequencies CASCADE;

-- Note: We do NOT drop the vector extension as it may be used by other features
-- If you need to remove it: DROP EXTENSION IF EXISTS vector;
