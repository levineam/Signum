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
  UPDATE term_frequencies
  SET
    count_alltime = count_alltime + p_amount,
    count_this_week = count_this_week + p_amount,
    last_updated = now()
  WHERE user_id = p_user_id AND term = p_term;
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
