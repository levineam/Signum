# Schema Validation Troubleshooting Guide

## Current Status (2025-11-21)

Schema validation is now **running automatically in CI** but currently **failing**. This is expected during initial setup - we need to align the validation script with the actual database schema.

## Connection Issues Fixed

We've resolved several connection issues:

### Issue 1: Pooler Port Mismatch ❌ → ✅
- **Problem**: Used pooler port 6543 which requires different auth format
- **Solution**: Switched to port 5432
- **Commit**: 20011be2

### Issue 2: IPv6 Connectivity ❌ → ✅
- **Problem**: Direct `db.PROJECT_REF.supabase.co` tried IPv6, which GitHub Actions doesn't support
- **Error**: `Network is unreachable (IPv6 address)`
- **Solution**: Use AWS pooler hostname `aws-0-us-east-2.pooler.supabase.com:5432`
- **Commit**: 49b33460

### Current Connection String Format
```
postgresql://postgres:PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

## Current Failure: Schema Validation Errors

**Run ID**: 19581687327
**Job**: Schema Validation (verification scripts)
**Status**: ❌ Failing

### How to View the Error

1. Go to: https://github.com/levineam/Signum/pull/182/checks
2. Click on "Schema Validation (verification scripts)" (red X)
3. Expand "Validate verification scripts against schema" step
4. Look for the error message

### Expected Error Format

The validator will show something like:
```sql
ERROR:  Schema validation failed. Missing or mismatched:
{
  "function increment_entity_centrality(uuid)",
  "table some_table_name",
  "index idx_some_index_name"
}
```

## Common Schema Drift Issues

### 1. Table Renames
**Problem**: Test scripts reference old table names
**Example**: Script uses `tasks` but schema has `_deprecated_tasks`

**Fix**: Update test scripts:
```sql
-- Before
SELECT * FROM tasks WHERE...

-- After
SELECT * FROM _deprecated_tasks WHERE...
```

### 2. Missing Indexes
**Problem**: Validator expects FK indexes that don't exist yet
**Example**: `idx_tasks_person_id` not created by migrations

**Fix**: Either:
- Apply the migration that creates the index
- Remove the index check from validator (if not needed yet)

### 3. Function Signature Mismatches
**Problem**: Function has different parameter count
**Example**: Test calls `increment_entity_centrality(uuid, int)` but actual function is `increment_entity_centrality(uuid)`

**Fix**: Update validator to match actual function signature:
```sql
-- In scripts/validate-test-scripts.sql
IF NOT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'increment_entity_centrality'
    AND p.pronargs = 1  -- <-- Match actual parameter count
) THEN
  issues := array_append(issues, 'function increment_entity_centrality(uuid)');
END IF;
```

## Fixing the Drift

### Step 1: Identify the Issues
From the GitHub Actions logs, note all "Missing or mismatched" items

### Step 2: Check Current Schema
Query your database to see what actually exists:
```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- Check function signatures
SELECT p.proname, p.pronargs
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

### Step 3: Update Validator or Schema
Choose one:
- **Option A**: Update `scripts/validate-test-scripts.sql` to match current schema
- **Option B**: Apply migrations to add missing schema objects

### Step 4: Test and Push
```bash
# Make changes
git add scripts/validate-test-scripts.sql
git commit -m "fix: Align validator with current schema"
git push

# CI runs automatically and validates
```

## Next Steps After Fixing

Once schema validation passes ✅:

1. **Phase 2**: Integrate fixtures into test scripts
2. **Phase 3**: Set up pre-commit hooks
3. **Phase 4**: AI-assisted test generation

## Helpful Commands

```bash
# View latest CI run
gh run list --repo levineam/Signum --workflow="continuous-testing.yml" --limit 1

# Watch a specific run
gh run view <RUN_ID> --repo levineam/Signum --web

# Check PR status
gh pr checks 182 --repo levineam/Signum

# Re-trigger CI (empty commit)
git commit --allow-empty -m "chore: Trigger CI" && git push
```

## References

- Validator script: `scripts/validate-test-scripts.sql`
- Test fixtures: `scripts/test-fixtures.sql`
- Epic documentation: `docs/stories/epic-1.11-database-security-performance.md`
- CI workflow: `.github/workflows/continuous-testing.yml`

---

**Status**: 🟡 Connection working, schema validation finding real drift (expected during setup)
