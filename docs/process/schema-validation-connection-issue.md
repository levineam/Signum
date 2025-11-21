# Schema Validation Connection Issue

## Status: ⏸️ Deferred - Schema Validation Disabled

**Date**: 2025-11-21
**Issue**: Unable to connect to Supabase from GitHub Actions CI

## Problem Summary

Automated schema validation in CI (`.github/workflows/continuous-testing.yml`) fails to connect to the Supabase database with error:

```
psql: error: connection to server at "aws-0-us-east-2.pooler.supabase.com" failed: FATAL: Tenant or user not found
```

## What We Tried

### ✅ Attempts Made

1. **Password Reset**: Reset database password multiple times in Supabase dashboard
2. **URL Encoding**: Encoded special characters in password (`$` → `%24`, `?` → `%3F`)
3. **Connection String Formats Tested**:
   - `postgresql://postgres:PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres`
   - `postgresql://postgres:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres`
   - `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres`
4. **GitHub Secret**: Updated `SCHEMA_DATABASE_URL` secret multiple times

### ❌ Results

All connection attempts failed with "Tenant or user not found" error, suggesting:
- Authentication method incompatibility between GitHub Actions and Supabase pooler
- Possible Supabase pooler restrictions on CI/CD environments
- Network/firewall rules blocking GitHub Actions IPs

## Current Workaround

**Schema validation is DISABLED** by removing the `SCHEMA_DATABASE_URL` secret.

The workflow gracefully skips validation when the secret is not set:

```bash
if [ -z "${SCHEMA_DATABASE_URL}" ]; then
  echo "SCHEMA_DATABASE_URL secret not set; skipping schema validation."
  exit 0
fi
```

## Files Modified

- `.github/workflows/continuous-testing.yml` - Schema validation job remains in workflow but skips when secret missing
- `scripts/validate-test-scripts.sql` - Updated to check Phase 2 schema (items/schedules/occurrences)

## Next Steps to Re-Enable

### Option 1: Supabase Direct Connection (Recommended)

Try using Supabase's direct connection URL instead of pooler:
1. Get direct connection string from: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/settings/database
2. Format: `postgresql://postgres:[PASSWORD]@db.otyvmmgakowcdsxehwox.supabase.co:5432/postgres`
3. Add as GitHub secret: `gh secret set SCHEMA_DATABASE_URL --repo levineam/Signum`

### Option 2: Service Role Key with Supabase CLI

Use Supabase CLI with service role key instead of psql:
1. Get service role key from: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/settings/api
2. Store as `SUPABASE_SERVICE_ROLE_KEY` secret
3. Update workflow to use `supabase db execute` instead of `psql`

### Option 3: Test Locally First

Before adding to CI:
1. Install psql locally: `brew install libpq`
2. Test connection string: `psql "CONNECTION_STRING" -c "SELECT 1"`
3. Only add to GitHub secrets once local connection works

## Impact

### ✅ What Still Works

- All other CI jobs (lint, type check, unit tests, build, E2E smoke tests)
- Manual schema validation via Supabase SQL Editor
- Test scripts can still be run manually with `psql -f scripts/test-story-*.sql`

### ❌ What's Missing

- Automated schema drift detection in CI
- Pre-merge validation that test scripts match current schema
- Early warning system for schema/test mismatches

## References

- Schema validator: `scripts/validate-test-scripts.sql`
- CI workflow: `.github/workflows/continuous-testing.yml` (lines 330-365)
- Phase 1 automation docs: `docs/process/phase1-automation-complete.md`
- Troubleshooting guide: `docs/process/schema-validation-troubleshooting.md`

---

**Priority**: Low - Schema validation is a "nice to have" for this PR. Focus on getting PR #182 merged first, then troubleshoot connection separately.
