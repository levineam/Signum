-- Rollback: Remove atomic increment functions

DROP FUNCTION IF EXISTS increment_term_frequency(TEXT, INT);
DROP FUNCTION IF EXISTS increment_entity_centrality(UUID);
