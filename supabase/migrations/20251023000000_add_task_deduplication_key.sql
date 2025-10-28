-- Add deduplication_key column to tasks table for atomic duplicate prevention
-- Story 1.2: Natural Language Task/Reminder Parsing

-- Add the deduplication_key column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deduplication_key TEXT;

-- Create unique index on deduplication_key to prevent race conditions
-- This ensures atomicity: two concurrent inserts with same key will result in one success, one constraint violation
CREATE UNIQUE INDEX IF NOT EXISTS tasks_deduplication_key_idx
ON tasks (deduplication_key)
WHERE deduplication_key IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN tasks.deduplication_key IS 'SHA256 hash of user_id:entry_id:paragraph_text for atomic duplicate prevention';
