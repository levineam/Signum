-- Migration: Update exercise_results constraints for new ontology-aligned exercise types
-- Issue: The original constraint only allowed ('values', 'strengths', 'impact', 'purpose')
--        but the app now uses ontology categories as exercise types

-- Step 1: Drop the existing CHECK constraint
-- The constraint name is auto-generated as exercise_results_exercise_type_check
ALTER TABLE exercise_results DROP CONSTRAINT IF EXISTS exercise_results_exercise_type_check;

-- Step 2: Add the new CHECK constraint with all ontology category types
ALTER TABLE exercise_results ADD CONSTRAINT exercise_results_exercise_type_check
  CHECK (exercise_type IN (
    'higher-power',
    'beliefs',
    'values',
    'people',
    'mission',
    'goals',
    'projects',
    'tasks'
  ));

-- Step 3: Add unique constraint on (user_id, exercise_type, version) to prevent duplicates
-- This enables the retry logic in the save endpoint to detect version conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_results_unique_version
  ON exercise_results(user_id, exercise_type, version);

-- Step 4: Migrate any existing data from old types to new types (if applicable)
-- Note: This maps the old exercise types to the closest new equivalents
-- Only runs if there's data to migrate (no-op if table is empty or already migrated)
UPDATE exercise_results
SET exercise_type = CASE exercise_type
  WHEN 'strengths' THEN 'beliefs'
  WHEN 'impact' THEN 'mission'
  WHEN 'purpose' THEN 'mission'
  ELSE exercise_type
END
WHERE exercise_type IN ('strengths', 'impact', 'purpose');
