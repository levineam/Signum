-- Security Warnings Remediation - Dashboard Advisor Fixes
-- Addresses 5 security warnings from Supabase Dashboard Advisor
-- Created: 2025-11-06
-- Related: docs/supabase-security-performance-audit.md

-- ============================================================================
-- ISSUE 1-3: Function Search Path Mutable (3 functions)
-- ============================================================================
-- Supabase Linter: 0011_function_search_path_mutable
-- Severity: WARN (SECURITY)
-- Description: Functions without explicit search_path are vulnerable to
--              search path injection attacks where malicious schemas could
--              override public schema functions.
--
-- Affected Functions:
--   1. public.update_updated_at_column
--   2. public.increment_term_frequency
--   3. public.increment_entity_centrality
--   4. public.create_ontology_update_notification (if exists)
-- ============================================================================

-- Fix 1: update_updated_at_column
-- Note: This was partially fixed in 20251015090000 but needs to be reapplied
-- to ensure the search_path is explicitly set in the function definition itself
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Add explicit SECURITY DEFINER
SET search_path = public  -- Harden search_path
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_updated_at_column() IS
  'Trigger function to auto-update updated_at timestamp. Uses SECURITY DEFINER with hardened search_path to prevent injection attacks.';

-- Fix 2: increment_term_frequency
-- Note: Already has search_path in 20251020000001, but redeclare to ensure
-- it's properly set in the function definition (not just via ALTER)
CREATE OR REPLACE FUNCTION public.increment_term_frequency(
  p_term TEXT,
  p_amount INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Ensure search_path is explicit in CREATE statement
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from auth.uid() to prevent cross-tenant tampering
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Use INSERT ... ON CONFLICT to handle both first insert and updates atomically
  INSERT INTO term_frequencies (user_id, term, count_alltime, count_this_week, count_last_week, last_updated)
  VALUES (v_user_id, p_term, p_amount, p_amount, 0, now())
  ON CONFLICT (user_id, term)
  DO UPDATE SET
    count_alltime = term_frequencies.count_alltime + p_amount,
    count_this_week = term_frequencies.count_this_week + p_amount,
    last_updated = now();
END;
$$;

-- Fix 3: increment_entity_centrality
-- Note: Already has search_path in 20251020000001, but redeclare to ensure
CREATE OR REPLACE FUNCTION public.increment_entity_centrality(
  p_entity_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Ensure search_path is explicit in CREATE statement
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from auth.uid() to prevent cross-tenant tampering
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE entities
  SET centrality = centrality + 1
  WHERE id = p_entity_id AND user_id = v_user_id;
END;
$$;

-- Fix 4: create_ontology_update_notification (if it exists)
-- This function was not found in migrations, so it may have been created via dashboard
-- If it doesn't exist, this will create a placeholder (can be dropped later if not needed)
-- If it does exist, this will add the missing search_path
DO $$
DECLARE
  v_func_signature TEXT;
BEGIN
  -- Check if function exists and get its full signature
  SELECT pg_get_function_identity_arguments(p.oid)
  INTO v_func_signature
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'create_ontology_update_notification'
  LIMIT 1;

  -- If function exists, alter it with proper signature
  IF v_func_signature IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.create_ontology_update_notification(%s) SET search_path = public', v_func_signature);
    RAISE NOTICE 'Fixed search_path for existing create_ontology_update_notification function with signature: %', v_func_signature;
  ELSE
    RAISE NOTICE 'Function create_ontology_update_notification does not exist - skipping';
  END IF;
END $$;

-- Re-grant execute permissions to ensure they persist after function recreation
GRANT EXECUTE ON FUNCTION public.increment_term_frequency TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_entity_centrality TO authenticated;

-- ============================================================================
-- ISSUE 4: Extension in Public Schema
-- ============================================================================
-- Supabase Linter: 0014_extension_in_public
-- Severity: WARN (SECURITY)
-- Description: The pgvector extension is installed in the public schema,
--              which can cause namespace conflicts and security issues.
--              Best practice is to install extensions in a dedicated schema.
--
-- Affected Extension: vector
-- ============================================================================

-- Fix: Move vector extension from public to extensions schema
-- Note: Supabase recommends the 'extensions' schema for all extensions

-- Step 1: Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move extension to extensions schema WITHOUT dropping data
-- This preserves all existing embeddings and dependent objects
ALTER EXTENSION vector SET SCHEMA extensions;

-- Step 3: Update RLS policy on paragraph_embeddings to use optimized auth.uid()
-- (This also ensures the policy exists after the schema move)
DROP POLICY IF EXISTS "Users can CRUD their own embeddings" ON paragraph_embeddings;
CREATE POLICY "Users can CRUD their own embeddings"
  ON paragraph_embeddings
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Step 4: Ensure service role policy exists (best practice from Story 2.4.6)
DROP POLICY IF EXISTS "Service role has full access to embeddings" ON paragraph_embeddings;
CREATE POLICY "Service role has full access to embeddings"
  ON paragraph_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add table comment
COMMENT ON TABLE paragraph_embeddings IS
  'Stores cached embeddings for journal entry paragraphs. Uses pgvector extension from extensions schema.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries after applying migration to confirm fixes:
--
-- 1. Verify all functions have search_path set:
--    SELECT
--      p.proname AS function_name,
--      pg_get_functiondef(p.oid) AS definition
--    FROM pg_proc p
--    JOIN pg_namespace n ON p.pronamespace = n.oid
--    WHERE n.nspname = 'public'
--    AND p.proname IN (
--      'update_updated_at_column',
--      'increment_term_frequency',
--      'increment_entity_centrality',
--      'create_ontology_update_notification'
--    );
--
-- 2. Verify vector extension is in extensions schema:
--    SELECT
--      e.extname AS extension_name,
--      n.nspname AS schema_name
--    FROM pg_extension e
--    JOIN pg_namespace n ON e.extnamespace = n.oid
--    WHERE e.extname = 'vector';
--
-- 3. Verify paragraph_embeddings table exists with correct schema:
--    \d paragraph_embeddings
--
-- 4. Verify RLS policies on paragraph_embeddings:
--    SELECT * FROM pg_policies WHERE tablename = 'paragraph_embeddings';
--
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If this migration causes issues, run the following to rollback:
--
-- -- Rollback vector extension move (preserves data)
-- ALTER EXTENSION vector SET SCHEMA public;
--
-- -- Rollback RLS policy changes on paragraph_embeddings
-- DROP POLICY IF EXISTS "Users can CRUD their own embeddings" ON paragraph_embeddings;
-- CREATE POLICY "Users can CRUD their own embeddings"
--   ON paragraph_embeddings FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
--
-- -- Rollback function changes (revert to previous definitions)
-- -- Use definitions from previous migrations
-- ============================================================================

-- Migration complete
