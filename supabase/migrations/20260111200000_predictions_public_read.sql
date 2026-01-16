-- Migration: Add public read access for predictions
-- Allows unauthenticated users to view predictions (for sharing links)

-- Allow anonymous users to read predictions
CREATE POLICY "predictions_select_anon"
  ON predictions FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read position counts (for odds display)
CREATE POLICY "prediction_positions_select_anon"
  ON prediction_positions FOR SELECT
  TO anon
  USING (true);
