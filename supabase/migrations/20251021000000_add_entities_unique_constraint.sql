-- Story 1.1: Add unique constraint to entities table
-- Prevents duplicate entity creation under concurrent upserts

-- Add unique constraint on (user_id, type, name)
ALTER TABLE entities
ADD CONSTRAINT unique_user_type_name UNIQUE(user_id, type, name);
