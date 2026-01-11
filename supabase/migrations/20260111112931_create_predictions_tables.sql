-- Migration: Create predictions tables for Alpha Predictions feature (Issue #231)
-- Creates predictions and prediction_positions tables with RLS policies

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Table: predictions
-- ============================================================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  settlement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution BOOLEAN,  -- NULL = unresolved, TRUE/FALSE = resolved outcome
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for predictions
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_settlement_date ON predictions(settlement_date DESC);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);

-- ============================================================================
-- Table: prediction_positions
-- ============================================================================
CREATE TABLE prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('agree', 'disagree')),
  points_awarded INTEGER,  -- NULL until prediction is resolved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prediction_id, user_id)  -- One position per user per prediction
);

-- Indexes for prediction_positions
CREATE INDEX idx_prediction_positions_prediction_id ON prediction_positions(prediction_id);
CREATE INDEX idx_prediction_positions_user_id ON prediction_positions(user_id);

-- ============================================================================
-- Triggers for updated_at (reuse existing function)
-- ============================================================================
CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prediction_positions_updated_at
  BEFORE UPDATE ON prediction_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Functions: Resolution + Positioning + Counts
-- ============================================================================
CREATE OR REPLACE FUNCTION resolve_prediction_and_award(
  prediction_id_input UUID,
  resolution_input BOOLEAN
)
RETURNS predictions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  updated_row predictions%ROWTYPE;
  agree_count INTEGER;
  disagree_count INTEGER;
  winner_side TEXT;
  winner_count INTEGER;
  loser_count INTEGER;
  majority_count INTEGER;
  minority_count INTEGER;
  majority_points INTEGER := 1;
  minority_points INTEGER;
  winner_points INTEGER;
BEGIN
  UPDATE predictions
  SET resolution = resolution_input,
      resolved_at = now()
  WHERE id = prediction_id_input
    AND user_id = auth.uid()
    AND resolved_at IS NULL
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prediction not found or already resolved' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE position = 'agree'),
    COUNT(*) FILTER (WHERE position = 'disagree')
  INTO agree_count, disagree_count
  FROM prediction_positions
  WHERE prediction_id = prediction_id_input;

  winner_side := CASE WHEN resolution_input THEN 'agree' ELSE 'disagree' END;
  winner_count := CASE WHEN winner_side = 'agree' THEN agree_count ELSE disagree_count END;
  loser_count := CASE WHEN winner_side = 'agree' THEN disagree_count ELSE agree_count END;

  majority_count := GREATEST(winner_count, loser_count);
  minority_count := LEAST(winner_count, loser_count);

  IF minority_count > 0 THEN
    minority_points := FLOOR(majority_count::numeric / minority_count)::int;
  ELSE
    minority_points := CASE WHEN majority_count > 0 THEN majority_count ELSE 1 END;
  END IF;

  winner_points := CASE WHEN winner_count >= loser_count THEN majority_points ELSE minority_points END;

  UPDATE prediction_positions
  SET points_awarded = CASE WHEN position = winner_side THEN winner_points ELSE 0 END
  WHERE prediction_id = prediction_id_input;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION take_prediction_position(
  prediction_id_input UUID,
  position_input TEXT
)
RETURNS prediction_positions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_at_value TIMESTAMPTZ;
  position_row prediction_positions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF position_input NOT IN ('agree', 'disagree') THEN
    RAISE EXCEPTION 'Invalid position' USING ERRCODE = 'P0001';
  END IF;

  SELECT resolved_at
  INTO resolved_at_value
  FROM predictions
  WHERE id = prediction_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prediction not found' USING ERRCODE = 'P0001';
  END IF;

  IF resolved_at_value IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot take position on resolved prediction' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO prediction_positions (prediction_id, user_id, position)
  VALUES (prediction_id_input, auth.uid(), position_input)
  ON CONFLICT (prediction_id, user_id)
  DO UPDATE SET position = EXCLUDED.position
  WHERE prediction_positions.points_awarded IS NULL
  RETURNING * INTO position_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot update position after resolution' USING ERRCODE = 'P0001';
  END IF;

  RETURN position_row;
END;
$$;

CREATE OR REPLACE FUNCTION get_prediction_position_counts(
  prediction_ids UUID[]
)
RETURNS TABLE (
  prediction_id UUID,
  agree_count INTEGER,
  disagree_count INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    prediction_id,
    COUNT(*) FILTER (WHERE position = 'agree')::int AS agree_count,
    COUNT(*) FILTER (WHERE position = 'disagree')::int AS disagree_count
  FROM prediction_positions
  WHERE prediction_id = ANY(prediction_ids)
  GROUP BY prediction_id;
$$;

GRANT EXECUTE ON FUNCTION resolve_prediction_and_award(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION take_prediction_position(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prediction_position_counts(UUID[]) TO authenticated;

-- ============================================================================
-- RLS Policies for predictions
-- ============================================================================
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all predictions (public feed)
CREATE POLICY "predictions_select_all"
  ON predictions FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own predictions
CREATE POLICY "predictions_insert_own"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only update their own predictions
CREATE POLICY "predictions_update_own"
  ON predictions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only delete their own predictions
CREATE POLICY "predictions_delete_own"
  ON predictions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Service role bypass for backend operations
CREATE POLICY "predictions_service_role"
  ON predictions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RLS Policies for prediction_positions
-- ============================================================================
ALTER TABLE prediction_positions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all positions (needed for odds calculation)
CREATE POLICY "prediction_positions_select_all"
  ON prediction_positions FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own positions
CREATE POLICY "prediction_positions_insert_own"
  ON prediction_positions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND points_awarded IS NULL
    AND COALESCE((SELECT resolved_at IS NULL FROM predictions WHERE id = prediction_id), false)
  );

-- Users can only update their own positions
CREATE POLICY "prediction_positions_update_own"
  ON prediction_positions FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND points_awarded IS NULL
    AND COALESCE((SELECT resolved_at IS NULL FROM predictions WHERE id = prediction_id), false)
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND points_awarded IS NULL
    AND COALESCE((SELECT resolved_at IS NULL FROM predictions WHERE id = prediction_id), false)
  );

-- Users can only delete their own positions
CREATE POLICY "prediction_positions_delete_own"
  ON prediction_positions FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND points_awarded IS NULL
    AND COALESCE((SELECT resolved_at IS NULL FROM predictions WHERE id = prediction_id), false)
  );

-- Service role bypass for backend operations (needed for points calculation)
CREATE POLICY "prediction_positions_service_role"
  ON prediction_positions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
