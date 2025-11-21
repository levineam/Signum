# Testing Schema Validator and Fixtures

## Current Status

The schema drift prevention infrastructure has been implemented (commit 8da52156):
- ✅ `scripts/validate-test-scripts.sql` - Schema validator
- ✅ `scripts/test-fixtures.sql` - Test data fixtures
- ✅ `docs/process/migration-checklist.md` - Pre-merge checklist
- ✅ `.github/workflows/continuous-testing.yml` - CI integration (disabled by default)

## Local Testing Required

Since the `.conductor/windhoek` workspace doesn't have local database configuration, you'll need to test manually using one of these methods:

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/sql/new)
2. Copy and paste `scripts/validate-test-scripts.sql` into the SQL editor
3. Run the query - should see: `✅ Schema validation passed for verification scripts`
4. Copy and paste `scripts/test-fixtures.sql` into the SQL editor
5. Run the query - should see: `✅ Fixtures seeded (skipped inserts where tables/columns are missing)`
6. Run one of the verification scripts (e.g., `scripts/test-story-1.11.2-after.sql`) to confirm fixtures work

### Method 2: psql with Connection String

If you have `psql` installed and your database password:

```bash
# Get connection string from Supabase dashboard
# Project Settings → Database → Connection string (Direct connection)

# Run validator
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -f scripts/validate-test-scripts.sql

# Seed fixtures
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -f scripts/test-fixtures.sql

# Test verification script
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -f scripts/test-story-1.11.2-after.sql
```

### Method 3: Upgrade Supabase CLI and Use Remote Commands

Your CLI is v2.26.9 (latest is v2.58.5). Upgrading may provide `db execute` commands:

```bash
# Upgrade CLI
brew upgrade supabase

# Then try
supabase db execute --remote < scripts/validate-test-scripts.sql
```

## Expected Results

### Schema Validator Output
```
🔍 Running schema validation for verification scripts...
✅ Schema validation passed for verification scripts
```

If it fails, you'll see:
```
ERROR:  Schema validation failed. Missing or mismatched: {function increment_entity_centrality(uuid), ...}
```

### Fixtures Output
```
🌱 Seeding minimal fixtures for verification scripts...
✅ Fixtures seeded (skipped inserts where tables/columns are missing)
```

### Verification Script Output (with fixtures)
After seeding fixtures, `test-story-1.11.2-after.sql` should:
- ✅ Show all 5 indexes exist
- ✅ Run all queries (no "SKIP" messages because fixtures provide guaranteed data)
- ✅ Show `idx_scan > 0` for all indexes in usage statistics

## Next Steps After Successful Testing

1. ✅ Confirm validator passes (no schema drift)
2. ✅ Confirm fixtures seed successfully
3. ✅ Confirm verification scripts run without skipping queries
4. **Enable CI validation** (optional):
   - Add `SCHEMA_DATABASE_URL` secret to GitHub
   - Set `SCHEMA_VALIDATION=true` in workflow
5. **Update test scripts to use fixtures** (optional):
   - Replace conditional `\if :{?variable}` logic with fixture UUIDs
   - Guaranteed test coverage instead of graceful degradation
6. **Update migration checklist** in PR #182 description

## Notes

- Fixtures use deterministic UUIDs (`00000000-0000-0000-0000-0000000000aa`, etc.)
- Fixtures are idempotent (safe to run multiple times)
- Validator checks function arity (parameter count) to prevent signature mismatches
- Both scripts guard against missing schema objects (won't error if tables don't exist yet)
