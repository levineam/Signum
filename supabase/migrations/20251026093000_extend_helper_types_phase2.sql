-- Migration: Extend helper_usage.helper_type with remaining helpers (Stories 2.5.9, 2.5.10, 2.5.12)
-- Stories: 2.5.9 Best Possible Self, 2.5.10 Savoring, 2.5.12 Loving-Kindness
-- Created: 2025-10-26
-- Description: Adds remaining helper types required for the journaling helpers roadmap.
-- Notes:
--   - Mental Contrasting (originally Story 2.5.13) was deemed redundant and not implemented.
--   - Progressive Muscle Relaxation (originally Story 2.5.11) was not implemented in this phase.

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
    'loving-kindness'
  )
);

-- Refresh column comment to reflect expanded types
COMMENT ON COLUMN helper_usage.helper_type IS
  'Type of helper used (cbt-distortions, gentle-prompt, gratitude, values-affirmation, self-compassion, woop, best-possible-self, savoring, loving-kindness)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback to the prior constraint state (Stories 2.5.5–2.5.8), run:
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
--       'woop'
--     )
--   );
--   COMMENT ON COLUMN helper_usage.helper_type IS
--     'Type of helper used (cbt-distortions, gentle-prompt, gratitude, values-affirmation, self-compassion, woop)';
-- COMMIT;
