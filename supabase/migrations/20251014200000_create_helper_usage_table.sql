-- Migration: Create Helper Usage Infrastructure
-- Story: 1.8.1 Helper Database Infrastructure
-- Created: 2025-10-14
-- Description: Creates helper_usage and user_preferences tables with RLS policies
--              and auto-update trigger for tracking helper interactions

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration, run the following SQL:
--
-- DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS helper_usage CASCADE;
-- DROP TABLE IF EXISTS user_preferences CASCADE;
--
-- ============================================================================

-- ============================================================================
-- PART 1: Create helper_usage Table
-- ============================================================================

-- Purpose: Track all helper interactions (insertions, selections, dismissals)
-- for AI improvement and analytics
CREATE TABLE IF NOT EXISTS helper_usage (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,

  -- Helper metadata
  helper_type TEXT NOT NULL,
  selected_items TEXT[] NOT NULL DEFAULT '{}'::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamp (single column per Codex feedback)
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_helper_type CHECK (
    helper_type IN ('cbt-distortions', 'gentle-prompt')
  )
);

-- ============================================================================
-- PART 2: Create user_preferences Table
-- ============================================================================

-- Purpose: Store user preferences including helper dismissal state
CREATE TABLE IF NOT EXISTS user_preferences (
  -- Primary key (also foreign key to auth.users)
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferences data
  dismissed_helpers JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamp (auto-updated via trigger)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PART 3: Create Trigger Function for Auto-Updating Timestamps
-- ============================================================================

-- Purpose: Automatically update updated_at field on UPDATE operations
-- (DEFAULT only applies to INSERT, so we need a trigger for UPDATE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: Attach Trigger to user_preferences Table
-- ============================================================================

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: Create Performance Indexes
-- ============================================================================

-- Index for user-specific queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_helper_usage_user_id
ON helper_usage(user_id);

-- Index for entry-specific queries (show helpers used for this entry)
CREATE INDEX IF NOT EXISTS idx_helper_usage_entry_id
ON helper_usage(entry_id);

-- Index for helper-type analytics (aggregate usage by helper type)
CREATE INDEX IF NOT EXISTS idx_helper_usage_helper_type
ON helper_usage(helper_type);

-- Index for chronological queries (recent usage, sorted by time)
CREATE INDEX IF NOT EXISTS idx_helper_usage_inserted_at
ON helper_usage(inserted_at DESC);

-- ============================================================================
-- PART 6: Enable Row-Level Security (RLS)
-- ============================================================================

-- Enable RLS on helper_usage table
ALTER TABLE helper_usage ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 7: Create RLS Policies for helper_usage Table
-- ============================================================================

-- SELECT policy: Users can view only their own helper usage
CREATE POLICY "Users can view own helper usage"
ON helper_usage FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy: Users can insert only their own helper usage
CREATE POLICY "Users can insert own helper usage"
ON helper_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update only their own helper usage
CREATE POLICY "Users can update own helper usage"
ON helper_usage FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete only their own helper usage
CREATE POLICY "Users can delete own helper usage"
ON helper_usage FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 8: Create RLS Policies for user_preferences Table
-- ============================================================================

-- SELECT policy: Users can view only their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy: Users can insert only their own preferences
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update only their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete only their own preferences
CREATE POLICY "Users can delete own preferences"
ON user_preferences FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 9: Add Table and Column Comments
-- ============================================================================

-- Table comments
COMMENT ON TABLE helper_usage IS
  'Tracks all helper interactions (insertions, selections, dismissals) for AI improvement and analytics';

COMMENT ON TABLE user_preferences IS
  'Stores user preferences including helper dismissal state and other future preferences';

-- helper_usage column comments
COMMENT ON COLUMN helper_usage.id IS
  'Unique identifier for each helper usage record';

COMMENT ON COLUMN helper_usage.user_id IS
  'Foreign key to auth.users - identifies which user used the helper';

COMMENT ON COLUMN helper_usage.entry_id IS
  'Foreign key to notes - identifies which journal entry the helper was used on';

COMMENT ON COLUMN helper_usage.helper_type IS
  'Type of helper used (cbt-distortions or gentle-prompt)';

COMMENT ON COLUMN helper_usage.selected_items IS
  'Array of items selected from the helper (e.g., distortion names, prompt categories)';

COMMENT ON COLUMN helper_usage.metadata IS
  'JSONB field for storing event history and additional context (events array, selection count, etc.)';

COMMENT ON COLUMN helper_usage.inserted_at IS
  'Timestamp when the helper usage record was created';

-- user_preferences column comments
COMMENT ON COLUMN user_preferences.user_id IS
  'Primary key and foreign key to auth.users - identifies the user';

COMMENT ON COLUMN user_preferences.dismissed_helpers IS
  'JSONB field storing which helpers the user has dismissed (key: helper_type, value: boolean)';

COMMENT ON COLUMN user_preferences.updated_at IS
  'Timestamp when preferences were last updated (auto-updated via trigger)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Verification queries to run after applying migration:
--
-- 1. Verify tables exist:
--    \d helper_usage
--    \d user_preferences
--
-- 2. Verify indexes created:
--    \di
--
-- 3. Verify RLS enabled:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE tablename IN ('helper_usage', 'user_preferences');
--
-- 4. Verify policies:
--    SELECT * FROM pg_policies WHERE tablename IN ('helper_usage', 'user_preferences');
--
-- 5. Verify trigger:
--    SELECT tgname, tgtype, tgenabled FROM pg_trigger
--    WHERE tgrelid = 'user_preferences'::regclass;
--
-- ============================================================================
