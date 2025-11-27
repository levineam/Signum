# Vercel Preview Testing Guide - PR #158

**PR:** Resolve 22 Supabase warnings & integrate BMAD system
**Preview URL:** (Wait for Vercel bot to comment on PR)
**Database:** Production Supabase (migrations need to be applied)

---

## ⚠️ Important: Database Migrations Required

**This PR includes database migrations that must be applied BEFORE testing the Vercel preview.**

The Vercel preview will deploy the application code, but **it connects to your production Supabase database**, which still has the old schema until you apply the migrations.

---

## 🚀 Testing Workflow

### Step 1: Wait for Vercel Preview URL (~2-3 minutes)

1. Go to PR #158: https://github.com/levineam/Signum/pull/158
2. Wait for **Vercel bot** to comment with preview URL
3. Look for comment like:
   ```
   ✅ Preview deployment for signum is ready!
   🔗 Preview: https://signum-xyz123.vercel.app
   ```
4. **DO NOT test yet** - migrations need to be applied first

---

### Step 2: Apply Database Migrations

**⚠️ CRITICAL: These migrations will modify your production database.**

If you want to be extra safe, you can:
- **Option A:** Test on dev environment first (recommended)
- **Option B:** Apply directly to production (faster)

#### Option A: Test on Dev First (Recommended)

```bash
# 1. Switch to dev branch in main repo
cd /Users/andrewleveiss/Signum
git checkout dev
git pull origin main  # Get latest changes

# 2. Cherry-pick the migration commits
git cherry-pick bmad-method-integration

# 3. Apply migrations to dev database via Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/editor
# Switch to DEV project (if you have one)
# Copy/paste migration SQL and run

# 4. Test on dev environment first
# 5. If successful, proceed with production migrations
```

#### Option B: Apply to Production (Faster)

**Apply both migrations via Supabase Dashboard:**

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/editor

2. **Apply Security Migration First:**
   - Click "New Query"
   - Copy entire contents of: `supabase/migrations/20251106000000_security_warnings_remediation.sql`
   - Paste into SQL Editor
   - Click "Run" (⌘ + Enter)
   - **Verify no errors** in output console
   - Expected output: "Query successfully completed"

3. **Apply Performance Migration Second:**
   - Click "New Query" again
   - Copy entire contents of: `supabase/migrations/20251106000001_performance_rls_optimization.sql`
   - Paste into SQL Editor
   - Click "Run" (⌘ + Enter)
   - **Verify no errors** in output console

4. **Verify Migrations Applied:**
   ```sql
   -- Check migration records (if you track migrations)
   SELECT * FROM supabase_migrations
   ORDER BY created_at DESC
   LIMIT 5;

   -- Or verify policies were updated
   SELECT tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('helper_usage', 'user_preferences', 'tasks')
   ORDER BY tablename;
   ```

---

### Step 3: Run Verification Script (Optional but Recommended)

**Via Supabase Dashboard:**

1. Copy contents of `scripts/verify-security-fixes.sql`
2. Paste into SQL Editor
3. Run the script
4. Review output - should show:
   - ✅ All functions have search_path set
   - ✅ Vector extension in extensions schema
   - ✅ All tables recreated properly
   - ✅ `total_issues_remaining = 0`

---

### Step 4: Test on Vercel Preview

Now that migrations are applied, test the application:

#### 4A. Smoke Tests (5 minutes)

**Basic Functionality:**
- [ ] Preview URL loads without errors
- [ ] Homepage renders correctly
- [ ] Can sign in with existing account
- [ ] No JavaScript errors in browser console (F12)
- [ ] No 403 Forbidden errors in Network tab

**Authentication:**
- [ ] Sign in works
- [ ] User profile loads
- [ ] Session persists across page refreshes

**Core Features:**
- [ ] Journal entries page loads
- [ ] Can view existing journal entries
- [ ] Can create new journal entry
- [ ] Notes page loads
- [ ] Can view existing notes
- [ ] Can create new note

#### 4B. Database Integration Tests (10 minutes)

**Test RLS Policies Work Correctly:**

1. **Create Test Content:**
   - Create a new journal entry
   - Create a new note
   - Add some tasks
   - Verify all save successfully

2. **Test User Isolation (Critical):**
   - Open preview URL in **incognito window**
   - Sign in as **different user** (or create new test account)
   - Try to access first user's content
   - **Expected:** Cannot see other user's data (RLS working)

3. **Test Helper System:**
   - Open a journal entry
   - Check if helpers load (CBT distortions, gentle prompts)
   - Select a helper option
   - Verify helper_usage table records the interaction

#### 4C. Performance Tests (5 minutes)

**Test Query Performance:**

1. **Open Browser DevTools** (F12) → Network tab
2. **Load pages with lots of data:**
   - Journal entries list (if you have many entries)
   - Notes list
   - Ontology page
3. **Check response times:**
   - API requests should be faster than before
   - Look for `/api/` requests in Network tab
   - Note response times (should be <500ms for most queries)

**Before/After Comparison:**
- If you have baseline timing data, compare
- Large queries (1000+ rows) should be 50-95% faster
- Small queries might not show noticeable difference

#### 4D. Ontology Extraction Test (Critical - Tests Embeddings)

**⚠️ This tests the paragraph_embeddings table was recreated correctly:**

1. **Go to a journal entry**
2. **Trigger ontology extraction:**
   - Click "Extract Ontology" or similar button
   - Wait for extraction to complete
3. **Expected Behavior:**
   - Extraction works (no errors)
   - May be slower than usual (cold cache - first run after migration)
   - Check browser console for errors
   - Verify ontology values/beliefs/aims are extracted

4. **Run extraction again:**
   - Second run should be faster (embeddings cached)

---

### Step 5: Check Supabase Dashboard Warnings

**Verify all 22 warnings are cleared:**

1. Go to: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/reports
2. Click **"Database Advisor"** or **"Advisor"**
3. Click **"Refresh"** if needed (may take up to 15 minutes to update)
4. **Expected:** 0 warnings (down from 22)

**If warnings still show:**
- Wait 15 minutes (dashboard cache refresh)
- Force refresh by navigating away and back
- Re-run verification script
- Check migration output for errors

---

### Step 6: Monitor Logs

**Check for errors during testing:**

1. **Vercel Logs:**
   - Go to Vercel Dashboard
   - Find preview deployment
   - Check "Functions" tab for API errors
   - Look for 500 errors or exceptions

2. **Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Filter for errors during testing window
   - Look for RLS policy violations
   - Check for auth-related errors

3. **Browser Console:**
   - Keep DevTools open (F12)
   - Watch for red error messages
   - Check Network tab for failed requests

---

## 🎯 Testing Checklist

### Pre-Testing:
- [ ] Vercel preview URL received
- [ ] Security migration applied to database
- [ ] Performance migration applied to database
- [ ] Verification script confirms 0 issues

### Smoke Tests:
- [ ] Preview URL loads
- [ ] Sign in works
- [ ] No console errors
- [ ] Journal entries load
- [ ] Notes load

### Critical Tests:
- [ ] Can create new content
- [ ] User isolation works (RLS policies)
- [ ] Helper system works
- [ ] Ontology extraction works
- [ ] Embeddings regenerate correctly

### Verification:
- [ ] Supabase Dashboard shows 0 warnings
- [ ] No errors in Vercel logs
- [ ] No errors in Supabase logs
- [ ] Performance is same or better

---

## 🚨 Rollback Plan

**If testing reveals issues:**

### Option 1: Fix Forward (Minor Issues)
- Identify the issue
- Create fix commit
- Push to same branch
- Vercel will auto-deploy new preview
- Re-test

### Option 2: Rollback Database (Major Issues)

**Rollback migrations via Supabase Dashboard:**

```sql
-- Rollback Security Migration
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;  -- Back to public schema

-- Recreate paragraph_embeddings with old schema
CREATE TABLE paragraph_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(1536),  -- Unqualified type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_content_hash UNIQUE(user_id, content_hash)
);

-- Recreate indexes and policies
-- (See rollback instructions in migration file)

-- Rollback Performance Migration
-- Replace (SELECT auth.uid()) with auth.uid() in all policies
-- (See rollback instructions in migration file)
```

### Option 3: Close PR (Critical Issues)
- Close PR without merging
- Investigate issues
- Fix and create new PR

---

## 📊 Success Criteria

**PR is ready to merge when:**
- ✅ All smoke tests pass
- ✅ RLS policies enforce user isolation
- ✅ Ontology extraction works
- ✅ Helper system works
- ✅ No errors in logs
- ✅ Supabase Dashboard shows 0 warnings
- ✅ Performance is same or better
- ✅ No breaking changes detected

---

## 💡 Testing Tips

### Performance Comparison
If you want to measure performance improvement:
```javascript
// Before migrations (in production console)
console.time('query');
fetch('/api/helper-usage?limit=1000').then(() => console.timeEnd('query'));

// After migrations (in preview console)
console.time('query');
fetch('/api/helper-usage?limit=1000').then(() => console.timeEnd('query'));

// Compare times - should be significantly faster
```

### Check RLS Policy Performance
```sql
-- Run in Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM helper_usage
WHERE user_id = auth.uid()
LIMIT 1000;

-- Look for "InitPlan" in output
-- Before: Multiple InitPlan nodes (bad)
-- After: Single InitPlan node (good)
```

### Verify Embeddings Work
```sql
-- Check embeddings table has data
SELECT COUNT(*) FROM paragraph_embeddings;

-- Check vector type is correct
SELECT
  column_name,
  data_type,
  udt_schema,
  udt_name
FROM information_schema.columns
WHERE table_name = 'paragraph_embeddings'
AND column_name = 'embedding';

-- Should show: udt_schema = 'extensions', udt_name = 'vector'
```

---

## 📞 Need Help?

**If you encounter issues:**

1. **Check migration output** - Look for SQL errors
2. **Run verification script** - Identify what failed
3. **Check logs** - Vercel + Supabase logs
4. **Share error messages** - I can help debug
5. **Consider rollback** - If critical issues found

---

## 🎉 After Successful Testing

**When all tests pass:**

1. **Comment on PR:**
   ```
   ✅ Tested on Vercel preview
   - All smoke tests pass
   - RLS policies working correctly
   - Ontology extraction works
   - Supabase Dashboard shows 0 warnings
   - Ready to merge
   ```

2. **Merge PR** (you do this, not Claude)

3. **Monitor production:**
   - Watch Vercel deployment
   - Check production logs for 24 hours
   - Monitor Supabase Dashboard Advisor
   - Watch for user-reported issues

4. **Celebrate!** 🎉
   - All 22 warnings resolved
   - 50-95% performance improvement
   - BMAD system integrated
   - Production-ready security hardening

---

**Start with Step 1: Wait for Vercel preview URL!**

Then proceed through steps in order. Take your time and verify each step before moving to the next.
