-- Rollback: Remove deduplication_key column and index from tasks table

-- Drop the unique index
DROP INDEX IF EXISTS tasks_deduplication_key_idx;

-- Drop the column
ALTER TABLE tasks
DROP COLUMN IF EXISTS deduplication_key;
