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

### ✅ Attempts Made (All Failed)

#### 1. **Password Reset & Verification**
- Reset database password 3+ times in Supabase dashboard
- Verified password manually (worked in local Supabase SQL Editor)
- Tested both original and URL-encoded formats

#### 2. **Connection String Formats**
All combinations tested with both plain and URL-encoded passwords:

**Pooler Connections:**
- `postgresql://postgres:PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres` (Session mode)
- `postgresql://postgres.otyvmmgakowcdsxehwox:PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres` (Session mode with project-qualified username)
- `postgresql://postgres:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres` (Transaction mode)
- `postgresql://postgres.otyvmmgakowcdsxehwox:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres` (Transaction mode with project-qualified username - incorrect per Supabase docs)

**Direct Connection:**
- `postgresql://postgres:PASSWORD@db.otyvmmgakowcdsxehwox.supabase.co:5432/postgres` (Direct connection)

#### 3. **Authentication Methods**
- `psql` with connection string
- Supabase CLI v2.0.4 with `--project-ref` and `--password` flags
- Both approaches failed with identical errors

#### 4. **Username Formats**
- Plain `postgres` username
- Project-qualified `postgres.PROJECT_REF` username
- Tested per Supabase documentation: session mode (port 5432) requires `postgres.PROJECT_REF`, transaction mode (port 6543) uses plain `postgres`

#### 5. **Password Encoding**
- Plain password: `x$2SfP?miIyTKHr$`
- URL-encoded: `x%242SfP%3FmiIyTKHr%24`
- Python3 urllib.parse.quote() in CI workflow for automatic encoding

#### 6. **Research & Documentation Review**
- Reviewed Supabase GitHub discussions about "Tenant or user not found" errors
- Read official Supabase connection documentation
- Verified we followed all recommended formats and practices

### ❌ Consistent Error

**All attempts failed with:**
```
psql: error: connection to server at "aws-0-us-east-2.pooler.supabase.com" failed:
FATAL: Tenant or user not found
```

### 🔍 Root Cause Analysis

The consistent failure across all methods suggests:
1. **GitHub Actions IP Blocking**: Supabase may restrict connections from GitHub Actions IP ranges
2. **CI/CD Environment Restrictions**: Supabase pooler may have special auth requirements for automated environments
3. **Project-Level Settings**: Database may require explicit allowlisting of external IPs
4. **Supabase Support Required**: May need to contact Supabase to enable CI/CD access

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

### Option 1: Contact Supabase Support (Recommended)

Since all standard connection methods failed, this may require Supabase assistance:
1. Open support ticket at https://supabase.com/dashboard/support
2. Ask about: "Enabling database connections from GitHub Actions CI/CD"
3. Provide error: "FATAL: Tenant or user not found" from IP ranges used by GitHub Actions
4. Request: Whitelist GitHub Actions IP ranges or provide alternative auth method

### Option 2: Use Local PostgreSQL in CI

Run schema validation against a local PostgreSQL instance in CI:
1. Use the existing `postgres:15` service container already in workflow
2. Apply migrations to local database in CI
3. Run validator against `localhost:5432`
4. **Downside**: Doesn't validate against production schema, only migration scripts

**Implementation:**
```yaml
- name: Apply migrations to local postgres
  run: |
    for f in supabase/migrations/*.sql; do
      psql "postgresql://postgres:postgres@localhost:5432/postgres" -f "$f"
    done

- name: Validate against local schema
  run: psql "postgresql://postgres:postgres@localhost:5432/postgres" -f scripts/validate-test-scripts.sql
```

### Option 3: Use GitHub Actions Self-Hosted Runner

Self-hosted runners may have different network policies:
1. Set up self-hosted runner with static IP
2. Whitelist that IP in Supabase dashboard (if option available)
3. Run schema validation job only on self-hosted runner

### Option 4: Switch to Supabase Branching (Future)

Supabase offers preview databases for PRs:
1. Enable Supabase GitHub integration
2. Each PR gets its own preview database
3. Run validation against preview database
4. Requires Supabase Pro plan ($25/month)

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
