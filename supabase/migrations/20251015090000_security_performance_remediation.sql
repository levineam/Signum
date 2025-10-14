-- Security & Performance Remediation
-- Addresses Supabase advisor warnings tracked in issue #14

-- ============================================================================
-- Harden helper function search_path
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

-- ============================================================================
-- Index hygiene
-- ============================================================================

-- Add covering index for journal_templates FK lookups
CREATE INDEX IF NOT EXISTS idx_journal_templates_user_id
  ON public.journal_templates(user_id);

-- Replace narrow link indexes with composite variants that match query patterns
DROP INDEX IF EXISTS public.idx_links_source;
DROP INDEX IF EXISTS public.idx_links_target;

CREATE INDEX IF NOT EXISTS idx_links_user_source
  ON public.links USING btree (user_id, source_note_id);

CREATE INDEX IF NOT EXISTS idx_links_user_target
  ON public.links USING btree (user_id, target_note_id);

-- Retire unused full-text indexes until we ship search
DROP INDEX IF EXISTS public.idx_journal_entries_content_search;
DROP INDEX IF EXISTS public.idx_journal_entries_tags;
DROP INDEX IF EXISTS public.idx_notes_search;

-- ============================================================================
-- RLS policy consolidation & auth.* caching
-- ============================================================================

-- journal_entries ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;

CREATE POLICY "Journal entries owner select"
  ON public.journal_entries
  FOR SELECT
  TO public
  USING (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.role()) = 'service_role')
  );

CREATE POLICY "Journal entries owner insert"
  ON public.journal_entries
  FOR INSERT
  TO public
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.role()) = 'service_role')
  );

CREATE POLICY "Journal entries owner update"
  ON public.journal_entries
  FOR UPDATE
  TO public
  USING (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.role()) = 'service_role')
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.role()) = 'service_role')
  );

CREATE POLICY "Journal entries owner delete"
  ON public.journal_entries
  FOR DELETE
  TO public
  USING (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.role()) = 'service_role')
  );

-- journal_templates ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own templates or public templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.journal_templates;

CREATE POLICY "Journal templates select"
  ON public.journal_templates
  FOR SELECT
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
    OR (is_public = true)
  );

CREATE POLICY "Journal templates insert"
  ON public.journal_templates
  FOR INSERT
  TO public
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Journal templates update"
  ON public.journal_templates
  FOR UPDATE
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Journal templates delete"
  ON public.journal_templates
  FOR DELETE
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  );

-- notes ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow prototype user CRUD without auth" ON public.notes;
DROP POLICY IF EXISTS "Users can CRUD their own notes" ON public.notes;

CREATE POLICY "Notes owner or prototype access"
  ON public.notes
  FOR ALL
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
    OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
    OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- links ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow prototype user links CRUD without auth" ON public.links;
DROP POLICY IF EXISTS "Users can CRUD their own links" ON public.links;

CREATE POLICY "Links owner or prototype access"
  ON public.links
  FOR ALL
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
    OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
    OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ============================================================================
-- Re-analyze for planner stats after index changes
-- ============================================================================
ANALYZE public.journal_templates;
ANALYZE public.links;
ANALYZE public.journal_entries;
ANALYZE public.notes;
