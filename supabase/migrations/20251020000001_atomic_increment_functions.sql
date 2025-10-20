-- Story 1.1: Add atomic increment functions for race-condition-free updates
-- Addresses PR #56 review feedback on concurrent increment safety

-- ============================================================================
-- Function: Atomic term frequency increment
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_term_frequency(
  p_user_id UUID,
  p_term TEXT,
  p_amount INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle both first insert and updates atomically
  -- This prevents race conditions on both initial creation and subsequent increments
  INSERT INTO term_frequencies (user_id, term, count_alltime, count_this_week, count_last_week, last_updated)
  VALUES (p_user_id, p_term, p_amount, p_amount, 0, now())
  ON CONFLICT (user_id, term)
  DO UPDATE SET
    count_alltime = term_frequencies.count_alltime + p_amount,
    count_this_week = term_frequencies.count_this_week + p_amount,
    last_updated = now();
END;
$$;

-- ============================================================================
-- Function: Atomic entity centrality increment
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_entity_centrality(
  p_entity_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE entities
  SET centrality = centrality + 1
  WHERE id = p_entity_id AND user_id = p_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_term_frequency TO authenticated;
GRANT EXECUTE ON FUNCTION increment_entity_centrality TO authenticated;
