-- Story 2.4.6: Remove Prototype User & Harden RLS Policies
-- Removes the prototype user backdoor and tightens RLS policies to authenticated role only
-- This migration addresses critical security findings from Issue #118

-- ============================================================================
-- Drop and recreate RLS policies WITHOUT prototype UUID
-- ============================================================================

-- NOTES TABLE -----------------------------------------------------------

-- Drop old policy that allowed prototype user access
DROP POLICY IF EXISTS "Notes owner or prototype access" ON public.notes;

-- Create user policy restricted to authenticated role (prevents anon access)
CREATE POLICY "Users can CRUD their own notes"
  ON public.notes
  FOR ALL
  TO authenticated  -- Restrict to authenticated role only (prevents anon access)
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Create service role policy for admin operations
CREATE POLICY "Service role has full access to notes"
  ON public.notes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- LINKS TABLE -----------------------------------------------------------

-- Drop old policy that allowed prototype user access
DROP POLICY IF EXISTS "Links owner or prototype access" ON public.links;

-- Create user policy restricted to authenticated role (prevents anon access)
CREATE POLICY "Users can CRUD their own links"
  ON public.links
  FOR ALL
  TO authenticated  -- Restrict to authenticated role only (prevents anon access)
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Create service role policy for admin operations
CREATE POLICY "Service role has full access to links"
  ON public.links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Delete prototype user from all auth tables
-- ============================================================================

-- Delete from auth.users (CASCADE removes associated data from notes, links, tasks, etc.)
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Explicitly clean up auth-related tables (Supabase keeps identity/token rows)
DELETE FROM auth.identities WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
DELETE FROM auth.refresh_tokens WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- ============================================================================
-- Verify complete deletion across all auth tables
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Prototype user still exists in auth.users';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Prototype user still exists in auth.identities';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.refresh_tokens WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Prototype user still exists in auth.refresh_tokens';
  END IF;
END $$;

-- ============================================================================
-- Add policy comments for documentation
-- ============================================================================

COMMENT ON POLICY "Users can CRUD their own notes" ON public.notes IS
  'Production policy: Users can only access their own notes via RLS. Restricted to authenticated role to prevent anonymous access.';

COMMENT ON POLICY "Service role has full access to notes" ON public.notes IS
  'Admin policy: Service role can access all notes for backend operations.';

COMMENT ON POLICY "Users can CRUD their own links" ON public.links IS
  'Production policy: Users can only access their own links via RLS. Restricted to authenticated role to prevent anonymous access.';

COMMENT ON POLICY "Service role has full access to links" ON public.links IS
  'Admin policy: Service role can access all links for backend operations.';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- This migration:
-- 1. Removes prototype UUID (00000000-0000-0000-0000-000000000000) from RLS policies
-- 2. Tightens policies to use TO authenticated instead of TO public
-- 3. Deletes prototype user from auth.users, auth.identities, auth.refresh_tokens
-- 4. Verifies complete deletion with assertions
-- 5. Documents policies with comments
--
-- After this migration, the app is ready for external user invitations.
