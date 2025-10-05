-- Story 2.4: Prototype User RLS Policy
-- Allows unauthenticated access for prototype user during development phase
-- This policy should be REMOVED before launching authentication

-- Create prototype user in auth.users to satisfy foreign key constraint
-- This is a dummy user that doesn't actually authenticate
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'authenticated',
  'authenticated',
  'prototype@signum.local',
  '$2a$10$PLACEHOLDER', -- Invalid bcrypt hash, can't actually login
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Prototype User"}'::jsonb,
  false,
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Allow unauthenticated access for prototype user (00000000-0000-0000-0000-000000000000)
CREATE POLICY "Allow prototype user CRUD without auth"
  ON notes
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000000'::UUID)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::UUID);

-- Same for links table
CREATE POLICY "Allow prototype user links CRUD without auth"
  ON links
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000000'::UUID)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::UUID);

COMMENT ON POLICY "Allow prototype user CRUD without auth" ON notes IS
  'TEMPORARY: Allows prototype testing without auth. Remove before production launch.';

COMMENT ON POLICY "Allow prototype user links CRUD without auth" ON links IS
  'TEMPORARY: Allows prototype testing without auth. Remove before production launch.';
