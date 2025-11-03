/**
 * Add query detection fields to tasks table
 * Story 1.9.1: Query Detection (Rules) for Query-Based Tasks
 *
 * Adds:
 * - is_query: Boolean flag indicating if task is a research query
 * - query_confidence: Float (0-1) representing confidence score
 *
 * Default: is_query = FALSE (most tasks are actions)
 */

-- Add is_query column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_query BOOLEAN DEFAULT FALSE;

-- Add query_confidence column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS query_confidence FLOAT DEFAULT 0.0;

-- Add index for performance (filtering by is_query)
CREATE INDEX IF NOT EXISTS idx_tasks_is_query ON tasks(is_query);

-- Add comment for documentation
COMMENT ON COLUMN tasks.is_query IS 'Indicates if task is a research query (can be answered by AI) vs actionable item (requires user action)';
COMMENT ON COLUMN tasks.query_confidence IS 'Confidence score (0-1) for query classification';
