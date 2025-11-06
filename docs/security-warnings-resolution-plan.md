# Supabase Security Warnings - Resolution Plan

**Date:** November 6, 2025
**Status:** ✅ READY FOR DEPLOYMENT
**Migration:** `20251106000000_security_warnings_remediation.sql`
**Verification:** `scripts/verify-security-fixes.sql`

---

## Executive Summary

All **5 security warnings** from the Supabase Dashboard Advisor have been analyzed and remediation SQL has been prepared. These are all **WARN level** security issues related to best practices (not critical vulnerabilities), but should be fixed before production launch.

### Issues Identified:
1. ⚠️ **4 functions missing search_path** (security injection risk)
2. ⚠️ **1 extension in wrong schema** (namespace pollution)

### Impact:
- **Security Risk:** LOW-MEDIUM (search path injection if malicious schema created)
- **Stability Risk:** LOW (extension namespace conflicts)
- **User Impact:** NONE (backend configuration only)

### Resolution Status:
- ✅ Migration created
- ✅ Verification script created
- ⏳ Awaiting user approval to apply

---

## Detailed Issue Analysis

### Issue 1-4: Function Search Path Mutable (4 functions)

**Supabase Linter:** `0011_function_search_path_mutable`
**Severity:** WARN (SECURITY)
**Category:** EXTERNAL

#### Affected Functions:

| Function Name | Location | Current Status |
|---------------|----------|----------------|
| `update_updated_at_column` | Multiple migrations | ❌ Partially fixed (ALTER applied, but not in CREATE) |
| `increment_term_frequency` | 20251020000001 | ❌ Has `SET search_path` but still flagged |
| `increment_entity_centrality` | 20251020000001 | ❌ Has `SET search_path` but still flagged |
| `create_ontology_update_notification` | Unknown (not in migrations) | ❌ Missing |

#### Why This Matters:

PostgreSQL functions without an explicit `search_path` are vulnerable to **search path injection attacks**. A malicious user could:

1. Create a schema with higher search priority
2. Define malicious functions with same names as public functions
3. Trick the database into executing malicious code

**Example Attack:**
```sql
-- Attacker creates malicious schema
CREATE SCHEMA attacker_schema;
SET search_path = attacker_schema, public;

-- Attacker creates malicious function
CREATE FUNCTION now() RETURNS timestamp AS $$
BEGIN
  -- Log sensitive data, modify data, etc.
  RETURN '2025-01-01'::timestamp;
END;
$$ LANGUAGE plpgsql;

-- Now when update_updated_at_column() calls now(),
-- it might call attacker_schema.now() instead of pg_catalog.now()
```

#### Root Cause:

**Why warnings persist despite previous fixes:**

1. **`update_updated_at_column`:**
   - Migration `20251015090000` used `ALTER FUNCTION ... SET search_path` (line 18-19)
   - This sets a default for the function but doesn't embed it in the function definition
   - Supabase linter wants `SET search_path` **in the CREATE statement** itself

2. **`increment_term_frequency` & `increment_entity_centrality`:**
   - Migration `20251020000001` correctly has `SET search_path = public` in CREATE (lines 15, 49)
   - **However**, Supabase may be detecting an older version from a previous migration
   - OR the linter requires additional `SECURITY DEFINER` attributes

3. **`create_ontology_update_notification`:**
   - **Not found in any migration file**
   - Likely created manually via Supabase Dashboard or pgAdmin
   - Need to find and fix this function

#### Fix Strategy:

```sql
-- Correct pattern (embeds search_path in CREATE statement):
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Add this
SET search_path = public  -- Embed in CREATE
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;
```

**Why this works:**
- `SET search_path = public` in CREATE statement embeds the setting in the function definition
- `SECURITY DEFINER` ensures function runs with creator's privileges (more secure)
- No need for separate `ALTER FUNCTION` statement

---

### Issue 5: Extension in Public Schema

**Supabase Linter:** `0014_extension_in_public`
**Severity:** WARN (SECURITY)
**Category:** EXTERNAL

#### Affected Extension:
- **Extension:** `vector` (pgvector)
- **Current Schema:** `public`
- **Recommended Schema:** `extensions`

#### Why This Matters:

Installing extensions in the `public` schema can cause:

1. **Namespace Pollution:** Extension functions/types conflict with user objects
2. **Security Risk:** Public schema is in default search path for all users
3. **Maintenance Issues:** Harder to manage extension upgrades
4. **Best Practice Violation:** Supabase recommends dedicated `extensions` schema

**Example Problem:**
```sql
-- Extension installs vector type in public schema
CREATE EXTENSION vector;  -- Creates public.vector type

-- User tries to create a table called 'vector'
CREATE TABLE vector (...);  -- NAME CONFLICT!
```

#### Current State:

From `20251020000000_content_intelligence_schema.sql` (line 9):
```sql
CREATE EXTENSION IF NOT EXISTS vector;  -- Installs in public schema by default
```

#### Fix Strategy:

```sql
-- 1. Create dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Drop extension from public (CASCADE removes dependent objects)
DROP EXTENSION IF EXISTS vector CASCADE;

-- 3. Reinstall in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 4. Recreate dependent objects (paragraph_embeddings table)
-- Must update type references from 'vector' to 'extensions.vector'
CREATE TABLE paragraph_embeddings (
  ...
  embedding extensions.vector(1536),  -- Qualified type name
  ...
);
```

**Impact:**
- ✅ Resolves namespace conflict
- ⚠️ Requires recreating `paragraph_embeddings` table (CASCADE drops it)
- ✅ All data in `paragraph_embeddings` will be lost (acceptable if no production data yet)

---

## Migration Details

### File: `supabase/migrations/20251106000000_security_warnings_remediation.sql`

**What it does:**

1. **Recreates 3 functions with embedded search_path:**
   - `update_updated_at_column` - Adds `SECURITY DEFINER` + `SET search_path`
   - `increment_term_frequency` - Redeclares with explicit settings
   - `increment_entity_centrality` - Redeclares with explicit settings

2. **Fixes mystery function (if exists):**
   - `create_ontology_update_notification` - Uses dynamic ALTER if found

3. **Moves vector extension to extensions schema:**
   - Creates `extensions` schema
   - Drops and recreates vector extension
   - Recreates `paragraph_embeddings` table with new schema reference
   - Recreates all indexes and RLS policies

**Safety Features:**
- Uses `IF EXISTS` / `IF NOT EXISTS` to prevent errors
- Documents rollback procedure
- Includes verification queries
- Adds comments for future maintainers

---

## Testing Plan

### Phase 1: Pre-Migration Verification (5 min)

**Run on production database to capture current state:**

```bash
# Option 1: Via Supabase CLI (requires DB password)
psql $DATABASE_URL -f scripts/verify-security-fixes.sql > pre-migration-report.txt

# Option 2: Via Supabase Dashboard
# Copy/paste verification queries from migration file (lines 89-126)
```

**Expected Results:**
- 4 functions should show "❌ MISSING search_path"
- vector extension should be in "public" schema
- paragraph_embeddings should exist with data (if any)

### Phase 2: Apply Migration (10 min)

#### Option A: Via Supabase CLI
```bash
# Apply migration to remote database
supabase db push
```

#### Option B: Via Supabase Dashboard (Safer for first time)
1. Go to https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/editor
2. Copy entire contents of `20251106000000_security_warnings_remediation.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Review output for errors

### Phase 3: Post-Migration Verification (5 min)

**Run verification script again:**
```bash
psql $DATABASE_URL -f scripts/verify-security-fixes.sql > post-migration-report.txt
```

**Expected Results:**
- ✅ All 4 functions should show "✅ FIXED"
- ✅ vector extension should be in "extensions" schema
- ✅ paragraph_embeddings should exist with 0 rows (recreated)
- ✅ All indexes and RLS policies should be recreated
- ✅ `total_issues_remaining = 0`

### Phase 4: Dashboard Re-Check (5 min)

1. Go to Supabase Dashboard → **Reports** → **Database Advisor**
2. Click "Refresh" or wait for automatic refresh
3. Verify all 5 warnings are cleared

**If warnings persist after 5 minutes:**
- Dashboard may cache results for up to 15 minutes
- Force refresh by navigating away and back
- Or wait 15 minutes and check again

---

## Rollback Plan

**If migration causes issues, run this SQL:**

```sql
-- Rollback vector extension move
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;  -- Back to public schema

-- Recreate paragraph_embeddings with public.vector
CREATE TABLE paragraph_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(1536),  -- Back to unqualified type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_content_hash UNIQUE(user_id, content_hash)
);

-- Recreate indexes
CREATE INDEX idx_paragraph_embeddings_vector
  ON paragraph_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_paragraph_embeddings_hash
  ON paragraph_embeddings(user_id, content_hash);

-- Recreate RLS policies
ALTER TABLE paragraph_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own embeddings"
  ON paragraph_embeddings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Revert functions to previous definitions (copy from earlier migrations)
```

---

## Risks & Mitigations

### Risk 1: Data Loss in paragraph_embeddings

**Risk Level:** MEDIUM
**Impact:** All cached embeddings will be deleted

**Mitigation:**
- ✅ Embeddings are cache data (can be regenerated)
- ✅ Application will regenerate embeddings on next use
- ⚠️ First ontology extraction after migration may be slower (cold cache)

**Decision:** ACCEPTABLE - proceed with migration

### Risk 2: Breaking Application Code

**Risk Level:** LOW
**Impact:** Application code referencing `vector` type may break

**Mitigation:**
- ✅ No application code directly uses `vector` type (only in migrations)
- ✅ Supabase client queries use `embedding` column name (no type reference)
- ✅ All vector operations go through Supabase RPC (abstracted)

**Decision:** SAFE to proceed

### Risk 3: Mystery Function May Fail to Fix

**Risk Level:** LOW
**Impact:** `create_ontology_update_notification` may remain unfixed

**Mitigation:**
- ✅ Migration uses `DO $$ ... END $$;` block with error handling
- ✅ If function doesn't exist, migration continues (logs NOTICE)
- ✅ If function exists but ALTER fails, migration will error (safe)

**Decision:** Investigate function after migration

---

## Post-Migration Tasks

### Task 1: Verify Embeddings Still Work

**Test:** Trigger ontology extraction on dev environment

```bash
# Via API call
curl -X POST https://signum-im11dbdvv-levineams-projects.vercel.app/api/extract-ontology \
  -H "Content-Type: application/json" \
  -d '{"entryId": "test-entry-id"}'
```

**Expected:** Extraction succeeds, new embeddings use `extensions.vector` type

### Task 2: Monitor Dashboard Advisor

**Check daily for 1 week:**
- Go to Dashboard → Reports → Database Advisor
- Verify no new warnings appear
- Confirm 5 security warnings remain cleared

### Task 3: Investigate Mystery Function

**If `create_ontology_update_notification` exists:**

```sql
-- Find the function definition
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_ontology_update_notification';
```

**Then:**
1. Determine if function is still needed
2. If needed: Verify search_path was set by migration
3. If not needed: Drop function
4. Document findings in project docs

---

## Performance Monitoring

**After migration, monitor for 24 hours:**

### Metrics to Watch:

1. **Ontology Extraction Latency**
   - Baseline: Current average extraction time
   - Post-migration: May increase 10-20% on first run (cold cache)
   - Should normalize after cache rebuilds

2. **Database Query Performance**
   - Baseline: Current p95 query latency
   - Post-migration: Should be same or slightly better (cleaner functions)

3. **Error Rates**
   - Watch API logs for vector-related errors
   - Check Supabase logs for RLS policy violations

### If Performance Degrades:

1. Check if embeddings cache is rebuilding (expected)
2. Verify indexes were recreated correctly (run verification script)
3. Check Supabase logs for function execution errors
4. If issues persist >24 hours, consider rollback

---

## Success Criteria

**Migration is successful when:**

- [ ] All 5 Supabase Dashboard warnings are cleared
- [ ] Verification script shows `total_issues_remaining = 0`
- [ ] `paragraph_embeddings` table exists with correct schema
- [ ] Application can successfully extract ontology (embeddings work)
- [ ] No new errors in Vercel or Supabase logs
- [ ] All RLS policies still enforce user isolation

---

## Timeline

**Recommended Deployment Window:** Low-traffic period (e.g., evening/weekend)

| Phase | Duration | Actions |
|-------|----------|---------|
| Pre-Migration | 5 min | Run verification script, backup current state |
| Migration | 10 min | Apply SQL via Dashboard or CLI |
| Verification | 5 min | Run verification script, check Dashboard |
| Testing | 15 min | Test ontology extraction on dev |
| Monitoring | 24 hours | Watch metrics, check logs |

**Total Active Time:** ~35 minutes
**Total Monitoring Time:** 24 hours

---

## Next Steps

### Option 1: Apply to Dev Environment First (Recommended)

```bash
# 1. Checkout to dev branch
git checkout dev

# 2. Copy migration to dev workspace
# (Already done - migration is in supabase/migrations/)

# 3. Push to dev branch
git add supabase/migrations/20251106000000_security_warnings_remediation.sql
git add scripts/verify-security-fixes.sql
git add docs/security-warnings-resolution-plan.md
git commit -m "feat: Fix 5 Supabase security warnings

- Harden search_path on 4 functions
- Move vector extension to extensions schema
- Add verification script

Resolves security warnings from Dashboard Advisor"
git push origin dev

# 4. Apply migration to dev database via Supabase Dashboard
# 5. Test thoroughly on dev environment
# 6. If successful, merge to main and deploy to production
```

### Option 2: Apply Directly to Production (Faster)

**Only if confident and low-risk environment:**

```bash
# Apply via Supabase CLI
supabase db push

# Or apply via Dashboard SQL Editor
# (Copy/paste migration contents)
```

---

## Questions for User

Before proceeding, please confirm:

1. **Data Loss Acceptable?**
   - Clearing `paragraph_embeddings` table (cache data only)
   - Can be regenerated automatically

2. **Deployment Window?**
   - When should we apply this migration?
   - Dev first, or directly to production?

3. **Mystery Function?**
   - Do you know what `create_ontology_update_notification` is for?
   - Was it created manually or by a tool?

---

**Status:** ✅ READY - Awaiting user approval to proceed

---

## References

- [Supabase Linter: Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase Linter: Extension in Public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Story 2.4.6: Production Security Hardening](./stories/story-2.4.6-production-security-hardening.md)
- [Security Baseline Document](./SECURITY_BASELINE.md)
