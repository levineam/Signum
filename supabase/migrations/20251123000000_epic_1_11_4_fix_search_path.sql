-- Epic 1.11 Story 1.11.4: Add SET search_path to Remaining Functions
-- Adds "SET search_path = public" to 6 functions to prevent search_path injection attacks
-- All function logic, parameters, and attributes (SECURITY DEFINER, STABLE) are preserved
-- Also drops legacy function signatures that are no longer used

-- ============================================================================
-- Drop Legacy Function Signatures (Without search_path)
-- ============================================================================

-- These are orphaned legacy functions with old signatures that are no longer called
-- by the application code. The new versions (with auth.uid() internally) have search_path set.

-- Drop old increment_entity_centrality(UUID, UUID) - replaced by increment_entity_centrality(UUID)
DROP FUNCTION IF EXISTS increment_entity_centrality(UUID, UUID);

-- Drop old increment_term_frequency(UUID, TEXT, INT) - replaced by increment_term_frequency(TEXT, INT)
DROP FUNCTION IF EXISTS increment_term_frequency(UUID, TEXT, INT);

-- ============================================================================
-- SECURITY DEFINER Functions (CRITICAL - prevents privilege escalation)
-- ============================================================================

-- Function to get or create analysis state for a user
CREATE OR REPLACE FUNCTION get_or_create_analysis_state(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  last_run_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- SECURITY: Allow service-role (auth.uid() IS NULL) or user requesting their own state
  -- This enables server-side admin operations while preventing cross-user access from clients
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another user''s analysis state';
  END IF;

  -- Insert if not exists, return existing otherwise
  INSERT INTO ontology_analysis_state (user_id, last_analyzed_at, last_run_summary)
  VALUES (p_user_id, NULL, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT
    oas.user_id,
    oas.last_analyzed_at,
    oas.last_run_summary,
    oas.created_at,
    oas.updated_at
  FROM ontology_analysis_state oas
  WHERE oas.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get notes for incremental analysis
-- NOTE: Excludes encrypted notes (encryption_version IS NULL) because
-- AI analysis requires plaintext content and encryption is client-side only
CREATE OR REPLACE FUNCTION get_notes_for_incremental_analysis(
  p_user_id UUID,
  p_last_analyzed_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- SECURITY: Allow service-role (auth.uid() IS NULL) or user requesting their own notes
  -- This enables server-side admin operations while preventing cross-user access from clients
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another user''s notes';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.title,
    n.content,
    n.note_type,
    n.metadata,
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type IN ('journal-entry', 'reflection', 'custom')
    AND n.encryption_version IS NULL  -- Exclude encrypted notes (can't analyze encrypted content server-side)
    AND (
      p_last_analyzed_at IS NULL
      OR n.updated_at > p_last_analyzed_at
    )
  ORDER BY n.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STABLE Functions (Best Practice - read-only functions should set search_path)
-- ============================================================================

-- Function to get journal entries for a user
CREATE OR REPLACE FUNCTION get_journal_entries(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  journal_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_sample BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    (n.metadata->>'journalDate')::DATE as journal_date,
    n.created_at,
    n.updated_at,
    COALESCE((n.metadata->>'isSample')::BOOLEAN, FALSE) as is_sample
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type = 'journal-entry'
  ORDER BY (n.metadata->>'journalDate') DESC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Function to get regular notes for a user
CREATE OR REPLACE FUNCTION get_regular_notes(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type IN ('custom', 'reflection')
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Function to get pinned ontology notes
CREATE OR REPLACE FUNCTION get_ontology_notes(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')
    AND n.is_pinned = TRUE
  ORDER BY
    CASE n.note_type
      WHEN 'ontology-value' THEN 1
      WHEN 'ontology-belief' THEN 2
      WHEN 'ontology-aim' THEN 3
    END;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- ============================================================================
-- Trigger Function (Best Practice - all functions should set search_path)
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Verify all functions have search_path set
-- Expected: All 6 functions should show {search_path=public} in proconfig
SELECT
  proname AS function_name,
  proconfig AS configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN (
    'get_or_create_analysis_state',
    'get_notes_for_incremental_analysis',
    'get_journal_entries',
    'get_regular_notes',
    'get_ontology_notes',
    'update_updated_at_column'
  )
ORDER BY proname;
