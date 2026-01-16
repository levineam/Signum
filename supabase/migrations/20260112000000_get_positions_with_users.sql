-- Migration: Add function to get positions with user emails
-- Returns positions for a prediction with the email of each user who took a position

CREATE OR REPLACE FUNCTION get_positions_with_users(prediction_id_input UUID)
RETURNS TABLE (
  id UUID,
  prediction_id UUID,
  user_id UUID,
  position TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    pp.id,
    pp.prediction_id,
    pp.user_id,
    pp.position,
    au.email,
    pp.created_at
  FROM prediction_positions pp
  JOIN auth.users au ON pp.user_id = au.id
  WHERE pp.prediction_id = prediction_id_input
  ORDER BY pp.created_at ASC;
$$;

-- Grant execute permission to authenticated users only (email is PII)
GRANT EXECUTE ON FUNCTION get_positions_with_users(UUID) TO authenticated;
