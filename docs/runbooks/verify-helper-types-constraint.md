# Verify helper_usage.helper_type Constraint

Purpose: confirm the consolidated migration `20251026000000_extend_helper_types.sql` added all helper types without requiring data inserts.

Steps
- Start local DB with migrations applied:
  - `supabase db reset` (destructive) or `supabase db start && supabase db migrate`
- Connect to Postgres (`psql`) and run:

```sql
-- Inspect CHECK constraint on helper_usage.helper_type
SELECT conname AS constraint_name,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'valid_helper_type'
  AND conrelid = 'helper_usage'::regclass;

-- Expected definition includes all values:
-- ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop')
```

Optional: runtime smoke check (requires existing user and note IDs due to FKs/RLS):

```sql
-- Replace placeholders with valid IDs from your environment
-- BEGIN;
-- INSERT INTO helper_usage (user_id, entry_id, helper_type)
-- VALUES ('00000000-0000-0000-0000-000000000000',
--         '00000000-0000-0000-0000-000000000000',
--         'gratitude');
-- ROLLBACK; -- Do not persist test data
```

If the first query returns a definition missing any of the new types, ensure the consolidated migration file exists and was applied successfully.

