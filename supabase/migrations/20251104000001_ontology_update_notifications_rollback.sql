-- Story 2.4.7: Ontology Update Notifications - Rollback
-- Removes notification system if issues arise during deployment
-- GitHub Issue: #129

-- ============================================================================
-- Drop trigger and function
-- ============================================================================

DROP TRIGGER IF EXISTS ontology_update_notification_trigger ON notes;
DROP FUNCTION IF EXISTS create_ontology_update_notification();

-- ============================================================================
-- Drop table (cascade removes all constraints and indexes)
-- ============================================================================

DROP TABLE IF EXISTS ontology_updates CASCADE;
