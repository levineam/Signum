/**
 * Rollback migration for query detection fields
 * Story 1.9.1: Query Detection (Rules) for Query-Based Tasks
 */

-- Drop index
DROP INDEX IF EXISTS idx_tasks_is_query;

-- Drop columns
ALTER TABLE tasks DROP COLUMN IF EXISTS query_confidence;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_query;
