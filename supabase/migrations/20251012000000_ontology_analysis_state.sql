-- Story 2.4.4: Incremental AI Ontology Analysis
-- Creates state tracking table and indexes for incremental analysis

-- ============================================================================
-- Add index on notes.updated_at for incremental queries
-- ============================================================================

-- This index supports queries like: SELECT * FROM notes WHERE updated_at > lastAnalyzedAt
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);

-- Composite index for incremental queries (user_id + note_type + updated_at)
CREATE INDEX IF NOT EXISTS idx_notes_incremental_query
  ON notes(user_id, note_type, updated_at DESC)
  WHERE note_type IN ('journal-entry', 'reflection', 'custom');

-- ============================================================================
-- Create ontology_analysis_state table
-- ============================================================================

CREATE TABLE ontology_analysis_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  last_run_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for querying analysis state
CREATE INDEX idx_ontology_state_user_id ON ontology_analysis_state(user_id);
CREATE INDEX idx_ontology_state_last_analyzed ON ontology_analysis_state(last_analyzed_at);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE ontology_analysis_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own analysis state
CREATE POLICY "Users can CRUD their own analysis state"
  ON ontology_analysis_state
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER ontology_analysis_state_updated_at
  BEFORE UPDATE ON ontology_analysis_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper functions
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
  -- SECURITY: Validate that caller is requesting their own state
  IF auth.uid() != p_user_id THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notes for incremental analysis
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
  -- SECURITY: Validate that caller is requesting their own notes
  IF auth.uid() != p_user_id THEN
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
    AND (
      p_last_analyzed_at IS NULL
      OR n.updated_at > p_last_analyzed_at
    )
  ORDER BY n.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
