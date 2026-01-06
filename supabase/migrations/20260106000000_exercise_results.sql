-- Migration: Create exercise_results table for micro-exercises
-- Story: Micro-Exercises for Ontology Population
-- Date: 2026-01-06

-- =============================================================================
-- Exercise Results Table
-- =============================================================================
-- Stores raw exercise data separately from the curated ontology.
-- This allows users to redo exercises without overwriting ontology items,
-- and enables AI synthesis from multiple exercise inputs.

CREATE TABLE IF NOT EXISTS exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Exercise identification
  exercise_type TEXT NOT NULL CHECK (
    exercise_type IN ('values', 'strengths', 'impact', 'purpose')
  ),
  
  -- Raw selections from the exercise
  -- Format: [{ id: string, name: string, category: string, rank?: number }]
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Free text responses (for impact, purpose exercises)
  free_text TEXT,
  
  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Version tracking for exercise iterations
  -- Incremented each time user redoes the same exercise type
  version INTEGER DEFAULT 1 NOT NULL,
  
  -- Provenance: links to ontology items generated from this exercise
  -- Format: [{ noteId: string, itemName: string }]
  generated_items JSONB DEFAULT '[]'::jsonb
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_exercise_results_user_id 
  ON exercise_results(user_id);

-- Fast lookup by user + exercise type (for latest result queries)
CREATE INDEX IF NOT EXISTS idx_exercise_results_user_type 
  ON exercise_results(user_id, exercise_type, completed_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own exercise results
CREATE POLICY exercise_results_select_own 
  ON exercise_results FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own exercise results
CREATE POLICY exercise_results_insert_own 
  ON exercise_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own exercise results
CREATE POLICY exercise_results_update_own 
  ON exercise_results FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own exercise results
CREATE POLICY exercise_results_delete_own 
  ON exercise_results FOR DELETE 
  USING (auth.uid() = user_id);

-- =============================================================================
-- Functions
-- =============================================================================

-- Get the latest exercise result for a user and type
CREATE OR REPLACE FUNCTION get_latest_exercise_result(
  p_user_id UUID,
  p_exercise_type TEXT
)
RETURNS exercise_results
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM exercise_results
  WHERE user_id = p_user_id 
    AND exercise_type = p_exercise_type
  ORDER BY completed_at DESC
  LIMIT 1;
$$;

-- Get all exercise completion status for a user
CREATE OR REPLACE FUNCTION get_exercise_completion_status(
  p_user_id UUID
)
RETURNS TABLE (
  exercise_type TEXT,
  completed BOOLEAN,
  last_completed_at TIMESTAMPTZ,
  version INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH exercise_types AS (
    SELECT unnest(ARRAY['values', 'strengths', 'impact', 'purpose']) AS etype
  ),
  latest_results AS (
    SELECT DISTINCT ON (exercise_type)
      exercise_type,
      completed_at,
      version
    FROM exercise_results
    WHERE user_id = p_user_id
    ORDER BY exercise_type, completed_at DESC
  )
  SELECT 
    et.etype AS exercise_type,
    lr.completed_at IS NOT NULL AS completed,
    lr.completed_at AS last_completed_at,
    COALESCE(lr.version, 0) AS version
  FROM exercise_types et
  LEFT JOIN latest_results lr ON et.etype = lr.exercise_type;
$$;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE exercise_results IS 
  'Stores raw micro-exercise results for ontology population. Each row represents one completed exercise.';

COMMENT ON COLUMN exercise_results.exercise_type IS 
  'Type of exercise: values, strengths, impact, or purpose';

COMMENT ON COLUMN exercise_results.selections IS 
  'JSONB array of selected items: [{ id, name, category, rank? }]';

COMMENT ON COLUMN exercise_results.free_text IS 
  'Free-form text response (used in impact and purpose exercises)';

COMMENT ON COLUMN exercise_results.version IS 
  'Incremented each time user redoes the same exercise type';

COMMENT ON COLUMN exercise_results.generated_items IS 
  'Provenance linking to ontology items created from this exercise result';
