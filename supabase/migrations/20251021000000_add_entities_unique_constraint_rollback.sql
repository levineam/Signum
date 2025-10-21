-- Rollback: Remove unique constraint from entities table

ALTER TABLE entities
DROP CONSTRAINT IF EXISTS unique_user_type_name;
