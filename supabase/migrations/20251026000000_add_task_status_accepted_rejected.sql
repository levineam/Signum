-- Migration: Add 'accepted' and 'rejected' to task status enum
-- Story 1.2.1: Inline Task Cards with Accept/Reject actions
-- Date: 2025-10-26

-- Drop the old constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_task_status;

-- Add new constraint with 'accepted' and 'rejected' statuses
ALTER TABLE tasks ADD CONSTRAINT check_task_status
  CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));

-- Update the index to exclude 'completed' and 'rejected' tasks
DROP INDEX IF EXISTS idx_tasks_user_due;
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at)
  WHERE status NOT IN ('completed', 'rejected');
