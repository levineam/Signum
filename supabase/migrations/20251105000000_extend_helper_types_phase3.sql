-- Migration: Add 'day-planning' to helper_usage.valid_helper_type constraint
-- Story: 2.11 Day Planning Helper
-- Created: 2025-11-05
-- Description: Extends helper_usage check constraint to include 'day-planning' helper type

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'helper_usage'
  ) THEN
    RAISE EXCEPTION 'Table helper_usage does not exist. Apply base migration first.';
  END IF;
END$$;

-- ============================================================================
-- UPDATE CHECK CONSTRAINT (DROP + RE-ADD)
-- ============================================================================
ALTER TABLE helper_usage DROP CONSTRAINT IF EXISTS valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN (
    'cbt-distortions',
    'gentle-prompt',
    'gratitude',
    'values-affirmation',
    'self-compassion',
    'woop',
    'best-possible-self',
    'savoring',
    'loving-kindness',
    'morning',                -- Added in Story 2.10
    'day-planning'            -- NEW for Story 2.11
  )
);

-- Refresh column comment to reflect expanded types
COMMENT ON COLUMN helper_usage.helper_type IS
  'Type of helper used (cbt-distortions, gentle-prompt, gratitude, values-affirmation, self-compassion, woop, best-possible-self, savoring, loving-kindness, morning, day-planning)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
--
-- BEGIN;
--   ALTER TABLE helper_usage DROP CONSTRAINT IF EXISTS valid_helper_type;
--   ALTER TABLE helper_usage
--   ADD CONSTRAINT valid_helper_type CHECK (
--     helper_type IN (
--       'cbt-distortions',
--       'gentle-prompt',
--       'gratitude',
--       'values-affirmation',
--       'self-compassion',
--       'woop',
--       'best-possible-self',
--       'savoring',
--       'loving-kindness',
--       'morning'
--     )
--   );
--   COMMENT ON COLUMN helper_usage.helper_type IS
--     'Type of helper used (cbt-distortions, gentle-prompt, gratitude, values-affirmation, self-compassion, woop, best-possible-self, savoring, loving-kindness, morning)';
-- COMMIT;
