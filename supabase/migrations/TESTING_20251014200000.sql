-- ============================================================================
-- VERIFICATION QUERIES for Migration 20251014200000
-- ============================================================================
-- Run these queries in Supabase Dashboard SQL Editor after applying migration
--
-- Navigate to: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Tables Exist
-- ============================================================================

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('helper_usage', 'user_preferences')
ORDER BY table_name;

-- Expected: 2 rows (helper_usage, user_preferences as BASE TABLE)

-- ============================================================================
-- STEP 2: Verify helper_usage Schema
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'helper_usage'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NO, gen_random_uuid())
-- user_id (uuid, NO, NULL)
-- entry_id (uuid, NO, NULL)
-- helper_type (text, NO, NULL)
-- selected_items (ARRAY, NO, '{}'::text[])
-- metadata (jsonb, NO, '{}'::jsonb)
-- inserted_at (timestamp with time zone, NO, now())

-- ============================================================================
-- STEP 3: Verify user_preferences Schema
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Expected columns:
-- user_id (uuid, NO, NULL)
-- dismissed_helpers (jsonb, NO, '{}'::jsonb)
-- updated_at (timestamp with time zone, NO, now())

-- ============================================================================
-- STEP 4: Verify Indexes Created
-- ============================================================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('helper_usage', 'user_preferences')
ORDER BY tablename, indexname;

-- Expected indexes on helper_usage:
-- - helper_usage_pkey (PRIMARY KEY on id)
-- - idx_helper_usage_user_id
-- - idx_helper_usage_entry_id
-- - idx_helper_usage_helper_type
-- - idx_helper_usage_inserted_at

-- ============================================================================
-- STEP 5: Verify RLS Enabled
-- ============================================================================

SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('helper_usage', 'user_preferences')
ORDER BY tablename;

-- Expected: rowsecurity = true for both tables

-- ============================================================================
-- STEP 6: Verify RLS Policies
-- ============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('helper_usage', 'user_preferences')
ORDER BY tablename, cmd, policyname;

-- Expected 8 policies total:
-- helper_usage: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- user_preferences: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- STEP 7: Verify Trigger Function Exists
-- ============================================================================

SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';

-- Expected: 1 row (update_updated_at_column, FUNCTION, trigger)

-- ============================================================================
-- STEP 8: Verify Trigger Attached to user_preferences
-- ============================================================================

SELECT
  tgname,
  tgtype,
  tgenabled,
  tgisinternal
FROM pg_trigger
WHERE tgrelid = 'user_preferences'::regclass
AND tgisinternal = false;

-- Expected: 1 row (update_user_preferences_updated_at, trigger before update)

-- ============================================================================
-- STEP 9: Test CHECK Constraint on helper_type
-- ============================================================================

-- This should SUCCEED (valid helper_type)
-- INSERT INTO helper_usage (user_id, helper_type, entry_id, selected_items, metadata)
-- VALUES (auth.uid(), 'cbt-distortions', 'some-uuid-here', ARRAY['item1'], '{}');

-- This should FAIL (invalid helper_type)
-- INSERT INTO helper_usage (user_id, helper_type, entry_id, selected_items, metadata)
-- VALUES (auth.uid(), 'invalid-type', 'some-uuid-here', ARRAY['item1'], '{}');

-- This should FAIL (future-helpers not yet supported)
-- INSERT INTO helper_usage (user_id, helper_type, entry_id, selected_items, metadata)
-- VALUES (auth.uid(), 'future-helpers', 'some-uuid-here', ARRAY['item1'], '{}');

-- ============================================================================
-- STEP 10: Test Auto-Update Trigger on user_preferences
-- ============================================================================

-- Insert a test preference
-- INSERT INTO user_preferences (user_id, dismissed_helpers)
-- VALUES (auth.uid(), '{"cbt-distortions": true}');

-- Record the timestamp
-- SELECT updated_at FROM user_preferences WHERE user_id = auth.uid();

-- Wait a few seconds, then update
-- UPDATE user_preferences
-- SET dismissed_helpers = '{"gentle-prompt": true}'
-- WHERE user_id = auth.uid();

-- Verify updated_at changed (should be newer)
-- SELECT updated_at FROM user_preferences WHERE user_id = auth.uid();

-- ============================================================================
-- STEP 11: Test Empty Array Default for selected_items
-- ============================================================================

-- This should SUCCEED (no selected_items provided, uses DEFAULT)
-- INSERT INTO helper_usage (user_id, helper_type, entry_id, metadata)
-- VALUES (auth.uid(), 'gentle-prompt', 'some-uuid-here', '{}');

-- Verify empty array was used
-- SELECT selected_items FROM helper_usage
-- WHERE user_id = auth.uid() AND helper_type = 'gentle-prompt'
-- ORDER BY inserted_at DESC LIMIT 1;

-- Expected: selected_items = {} (empty array)

-- ============================================================================
-- ALL VERIFICATION COMPLETE
-- ============================================================================
-- If all queries return expected results, migration was successful!
-- ============================================================================
