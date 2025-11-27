-- Test Script for Story 1.11.1: Fix Database Function Security (search_path)
-- Purpose: Verify functions have explicit search_path set and work correctly
-- Story: #179
-- Epic: 1.11 - Database Security & Performance Optimization

-- ============================================================================
-- PART 1: Verify function definitions include search_path
-- ============================================================================

\echo '=== Checking increment_entity_centrality function definition ==='
\df+ increment_entity_centrality

\echo ''
\echo '=== Checking increment_term_frequency function definition ==='
\df+ increment_term_frequency

\echo ''
\echo 'Expected: Both functions should show "SET search_path = public" in their definitions'
\echo ''

-- ============================================================================
-- PART 2: Test entity centrality tracking
-- ============================================================================

\echo '=== Testing entity centrality increment ==='

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

-- Simulate authenticated user context for auth.uid()
SELECT set_config('request.jwt.claim.sub', :test_user_id::text, true);
SELECT set_config('request.jwt.claim.raw', '{"sub": "' || :test_user_id || '"}', true);

-- Create test entity (if not exists)
INSERT INTO entities (id, user_id, entity_name, entity_type, centrality)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  :test_user_id::uuid,
  'Test Entity',
  'concept',
  0
)
ON CONFLICT (id) DO NOTHING;

-- Get current centrality
SELECT id, entity_name, centrality
FROM entities
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Increment centrality
SELECT increment_entity_centrality('00000000-0000-0000-0000-000000000001'::uuid);

-- Verify increment worked
SELECT id, entity_name, centrality
FROM entities
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

\echo 'Expected: Centrality should have incremented by 1'
\echo ''

-- ============================================================================
-- PART 3: Test term frequency tracking
-- ============================================================================

\echo '=== Testing term frequency increment ==='

-- Auth context already set above for test_user_id

-- Check current frequency for test term
SELECT user_id, term, count_alltime, count_this_week, count_last_week, last_updated
FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test';

-- Increment term frequency
SELECT increment_term_frequency('test', 1);

-- Verify increment worked
SELECT user_id, term, count_alltime, count_this_week, count_last_week, last_updated
FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test';

\echo 'Expected: count_alltime and count_this_week should have incremented by 1'
\echo ''

-- ============================================================================
-- PART 4: Verify no PostgreSQL errors
-- ============================================================================

\echo '=== Checking PostgreSQL error log ==='
\echo 'If no errors appeared above, functions are working correctly'
\echo ''

-- ============================================================================
-- CLEANUP (optional)
-- ============================================================================

-- Uncomment to clean up test data:
-- DELETE FROM entities WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
-- DELETE FROM term_frequencies WHERE user_id = :test_user_id::uuid AND term = 'test';

\echo '=== Story 1.11.1 Test Complete ==='
\echo ''
\echo 'Acceptance Criteria Checklist:'
\echo '[ ] Both functions show SET search_path = public in \df+ output'
\echo '[ ] increment_entity_centrality executes without errors'
\echo '[ ] increment_term_frequency executes without errors'
\echo '[ ] Entity centrality incremented correctly'
\echo '[ ] Term frequency incremented correctly'
\echo '[ ] No PostgreSQL errors in output'
\echo ''
\echo 'Next: Run Supabase Database Linter and verify 0 warnings for lint 0011_function_search_path_mutable'
