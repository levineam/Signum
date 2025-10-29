-- Migration: Extend helper_usage.helper_type with additional helpers (2.5.5–2.5.8)
-- Stories: 2.5.5 Gratitude, 2.5.6 Values Affirmation, 2.5.7 Self-Compassion, 2.5.8 WOOP
-- Created: 2025-10-26
-- Description: Consolidates prior per-story constraint edits into a single superset
--              update to avoid repetitive drop/add cycles. Adds the following
--              helper types alongside existing values:
--              'gratitude', 'values-affirmation', 'self-compassion', 'woop'

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
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
    'woop'
  )
);

-- Optional: refresh column comment to reflect broadened scope
COMMENT ON COLUMN helper_usage.helper_type IS
  'Type of helper used (cbt-distortions, gentle-prompt, gratitude, values-affirmation, self-compassion, woop)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback to the prior constraint that allowed only the initial types
-- (as of Story 1.8.1):
--
-- BEGIN;
--   ALTER TABLE helper_usage DROP CONSTRAINT IF EXISTS valid_helper_type;
--   ALTER TABLE helper_usage
--   ADD CONSTRAINT valid_helper_type CHECK (
--     helper_type IN ('cbt-distortions', 'gentle-prompt')
--   );
-- COMMIT;

