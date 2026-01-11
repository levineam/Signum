-- Migration: Create predictions tables for Alpha Predictions feature (Issue #231)
-- Creates predictions and prediction_positions tables with RLS policies

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
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only update their own positions
CREATE POLICY "prediction_positions_update_own"
  ON prediction_positions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only delete their own positions
CREATE POLICY "prediction_positions_delete_own"
  ON prediction_positions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Service role bypass for backend operations (needed for points calculation)
CREATE POLICY "prediction_positions_service_role"
  ON prediction_positions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
