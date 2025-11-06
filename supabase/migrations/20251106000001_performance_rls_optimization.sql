-- Performance Warnings Remediation - RLS Policy Optimization
-- Addresses 17 performance warnings from Supabase Dashboard Advisor
-- Created: 2025-11-06
-- Related: docs/supabase-security-performance-audit.md

-- ============================================================================
-- ISSUE: Auth RLS Initialization Plan (17 policies across 10 tables)
-- ============================================================================
-- Supabase Linter: 0003_auth_rls_initplan
-- Severity: WARN (PERFORMANCE)
-- Description: RLS policies calling auth.uid() are re-evaluated for EVERY row
--              instead of being cached once per query. This causes significant
--              performance degradation at scale.
--
-- Root Cause:
--   BAD:  USING (auth.uid() = user_id)
--   GOOD: USING ((SELECT auth.uid()) = user_id)
--
-- The subquery (SELECT auth.uid()) tells PostgreSQL to evaluate auth.uid()
-- ONCE per query and cache the result, rather than calling it for every row.
--
-- Affected Tables (10):
--   1. helper_usage (4 policies)
--   2. user_preferences (4 policies)
--   3. term_frequencies (1 policy)
--   4. entities (1 policy)
--   5. tasks (1 policy)
--   6. reminders (1 policy)
--   7. meters_daily (1 policy)
--   8. paragraph_embeddings (1 policy)
--   9. ontology_updates (3 policies)
--  10. (notes and links already fixed in Story 2.4.6)
--
-- Total Policies to Fix: 17
-- ============================================================================

-- ============================================================================
-- TABLE 1: helper_usage (4 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own helper usage" ON public.helper_usage;
DROP POLICY IF EXISTS "Users can insert own helper usage" ON public.helper_usage;
DROP POLICY IF EXISTS "Users can update own helper usage" ON public.helper_usage;
DROP POLICY IF EXISTS "Users can delete own helper usage" ON public.helper_usage;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own helper usage"
  ON public.helper_usage
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own helper usage"
  ON public.helper_usage
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    entry_id IN (SELECT id FROM notes WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can update own helper usage"
  ON public.helper_usage
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    entry_id IN (SELECT id FROM notes WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can delete own helper usage"
  ON public.helper_usage
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Add service role policy (best practice from Story 2.4.6)
CREATE POLICY "Service role has full access to helper usage"
  ON public.helper_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 2: user_preferences (4 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 3: term_frequencies (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own term frequencies" ON public.term_frequencies;

CREATE POLICY "Users can CRUD their own term frequencies"
  ON public.term_frequencies
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to term frequencies"
  ON public.term_frequencies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 4: entities (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own entities" ON public.entities;

CREATE POLICY "Users can CRUD their own entities"
  ON public.entities
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to entities"
  ON public.entities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 5: tasks (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own tasks" ON public.tasks;

CREATE POLICY "Users can CRUD their own tasks"
  ON public.tasks
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to tasks"
  ON public.tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 6: reminders (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own reminders" ON public.reminders;

CREATE POLICY "Users can CRUD their own reminders"
  ON public.reminders
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to reminders"
  ON public.reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 7: meters_daily (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own daily metrics" ON public.meters_daily;

CREATE POLICY "Users can CRUD their own daily metrics"
  ON public.meters_daily
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add service role policy
CREATE POLICY "Service role has full access to daily metrics"
  ON public.meters_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE 8: paragraph_embeddings (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can CRUD their own embeddings" ON public.paragraph_embeddings;

CREATE POLICY "Users can CRUD their own embeddings"
  ON public.paragraph_embeddings
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Service role policy already added in security migration

-- ============================================================================
-- TABLE 9: ontology_updates (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own ontology updates" ON public.ontology_updates;
DROP POLICY IF EXISTS "Users can update their own ontology updates" ON public.ontology_updates;
DROP POLICY IF EXISTS "System can insert ontology updates" ON public.ontology_updates;

CREATE POLICY "Users can view their own ontology updates"
  ON public.ontology_updates
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own ontology updates"
  ON public.ontology_updates
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- System policy for service role to insert updates
CREATE POLICY "System can insert ontology updates"
  ON public.ontology_updates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add general service role policy
CREATE POLICY "Service role has full access to ontology updates"
  ON public.ontology_updates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Re-analyze tables for query planner statistics
-- ============================================================================

ANALYZE public.helper_usage;
ANALYZE public.user_preferences;
ANALYZE public.term_frequencies;
ANALYZE public.entities;
ANALYZE public.tasks;
ANALYZE public.reminders;
ANALYZE public.meters_daily;
ANALYZE public.paragraph_embeddings;
ANALYZE public.ontology_updates;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries after applying migration to confirm fixes:
--
-- 1. Verify all policies use (SELECT auth.uid()) pattern:
--    SELECT
--      schemaname,
--      tablename,
--      policyname,
--      qual AS using_clause,
--      with_check AS with_check_clause
--    FROM pg_policies
--    WHERE tablename IN (
--      'helper_usage', 'user_preferences', 'term_frequencies',
--      'entities', 'tasks', 'reminders', 'meters_daily',
--      'paragraph_embeddings', 'ontology_updates'
--    )
--    ORDER BY tablename, policyname;
--
-- 2. Verify no policies still use bare auth.uid() (should return 0 rows):
--    SELECT tablename, policyname
--    FROM pg_policies
--    WHERE (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%')
--    AND (qual::text NOT LIKE '%(SELECT auth.uid())%' OR with_check::text NOT LIKE '%(SELECT auth.uid())%')
--    AND schemaname = 'public';
--
-- 3. Count policies per table:
--    SELECT tablename, COUNT(*) AS policy_count
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    GROUP BY tablename
--    ORDER BY tablename;
--
-- ============================================================================

-- ============================================================================
-- Performance Impact Estimation
-- ============================================================================
-- Before: N rows × M policies × auth.uid() calls = N×M database lookups
-- After:  1 × M policies × auth.uid() calls = M database lookups (cached per query)
--
-- Example with 1000 rows:
--   Before: 1000 × 4 = 4000 auth.uid() calls for helper_usage
--   After:  1 × 4 = 4 auth.uid() calls (99.6% reduction)
--
-- Expected Performance Improvement:
--   - Small queries (< 100 rows): 10-20% faster
--   - Medium queries (100-1000 rows): 50-70% faster
--   - Large queries (1000+ rows): 90-95% faster
-- ============================================================================

-- Migration complete
