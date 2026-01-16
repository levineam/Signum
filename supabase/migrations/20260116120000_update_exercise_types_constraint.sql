-- Migration: Update exercise_results constraints for new ontology-aligned exercise types
-- Issue: The original constraint only allowed ('values', 'strengths', 'impact', 'purpose')
--        but the app now uses ontology categories as exercise types
--
-- IMPORTANT: Order matters to avoid constraint violations:
-- 1. Drop old CHECK constraint FIRST (allows new type values)
-- 2. Migrate data to new types
-- 3. Handle potential duplicates that would violate unique constraint
-- 4. Add new CHECK constraint
-- 5. Add unique index (after data is clean)

-- Step 1: Drop the existing CHECK constraint FIRST
-- Must drop before data migration, otherwise UPDATE would violate old constraint
-- (old constraint only allows: 'values', 'strengths', 'impact', 'purpose')
ALTER TABLE exercise_results DROP CONSTRAINT IF EXISTS exercise_results_exercise_type_check;

-- Step 2: Migrate data from old types to new types
-- Map: strengths → beliefs, impact → mission, purpose → mission
-- This can now run because the CHECK constraint is dropped
UPDATE exercise_results
SET exercise_type = CASE exercise_type
  WHEN 'strengths' THEN 'beliefs'
  WHEN 'impact' THEN 'mission'
  WHEN 'purpose' THEN 'mission'
  ELSE exercise_type
END
WHERE exercise_type IN ('strengths', 'impact', 'purpose');

-- Step 3: Handle potential duplicates from impact/purpose → mission mapping
-- If a user has both 'impact' version 1 and 'purpose' version 1, they'd collide after mapping
-- Increment version for duplicates to make them unique
-- This uses a CTE to find and fix duplicates by incrementing their version
WITH duplicates AS (
  SELECT id, user_id, exercise_type, version,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, exercise_type, version
           ORDER BY completed_at ASC
         ) as rn
  FROM exercise_results
)
UPDATE exercise_results er
SET version = er.version + (d.rn - 1) * 1000  -- Offset duplicates by 1000 to avoid further conflicts
FROM duplicates d
WHERE er.id = d.id AND d.rn > 1;

-- Step 4: Add the new CHECK constraint with all ontology category types
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

-- Step 5: Add unique constraint on (user_id, exercise_type, version) to prevent duplicates
-- This enables the retry logic in the save endpoint to detect version conflicts
-- Only created AFTER data migration to avoid conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_results_unique_version
  ON exercise_results(user_id, exercise_type, version);
