# Story 2.4.6 Execution Checklist

**Story:** Production Security Hardening & Logging Infrastructure
**GitHub Issue:** [#118](https://github.com/levineam/Signum/issues/118)
**Created:** 2025-11-03
**Status:** 📋 Not Started

---

## Pre-Flight Checklist

- [ ] Story document reviewed: `docs/stories/story-2.4.6-production-security-hardening.md`
- [ ] GitHub Issue #118 reviewed and understood
- [ ] Prerequisites verified:
  - [ ] Story 2.4.0 (Dev Environment) ✅ Complete
  - [ ] Story 2.4.1 (Auth Integration) ✅ Complete
  - [ ] Story 2.4.2 (Link Migration) ✅ Complete
- [ ] Dev environment accessible and functional
- [ ] Supabase dashboard access confirmed
- [ ] Test accounts created (User A, User B)

---

## Phase 1: Remove Prototype User (CRITICAL - 45-60 min)

### Task 1.1: Create Migration File (15 min)
- [ ] Create new migration file with timestamp
  - Path: `supabase/migrations/[timestamp]_remove_prototype_user.sql`
- [ ] Add DROP POLICY statements for notes and links
- [ ] Add CREATE POLICY statements without prototype UUID
- [ ] Add DELETE statement for prototype user
- [ ] Add verification DO block to confirm deletion
- [ ] Add COMMENT statements for documentation
- [ ] Review SQL syntax for errors
- [ ] Commit migration file

**Migration File Checklist:**
- [ ] Drops `"Notes owner or prototype access"` policy
- [ ] Creates `"Users can CRUD their own notes"` policy
- [ ] Drops `"Links owner or prototype access"` policy
- [ ] Creates `"Users can CRUD their own links"` policy
- [ ] Deletes `00000000-0000-0000-0000-000000000000` from auth.users
- [ ] Includes verification assertion
- [ ] Adds policy comments

### Task 1.2: Update Seed Script (15 min)
- [ ] Open `scripts/seed-sample-journal-entries.ts`
- [ ] Remove `PROTOTYPE_USER_ID` constant (line 17)
- [ ] Add user ID parameter/environment variable
- [ ] Add input validation
- [ ] Update script documentation/header
- [ ] Add usage examples
- [ ] Test script compiles (TypeScript)
- [ ] Commit changes

**Verification:**
- [ ] No hardcoded UUID `00000000-0000-0000-0000-000000000000` remains
- [ ] Script accepts user ID via parameter or env var
- [ ] Usage instructions clear and complete

### Task 1.3: Test Migration in Dev Environment (15 min)
- [ ] Connect to dev Supabase project
- [ ] Run migration file
- [ ] Verify migration succeeded (no errors)
- [ ] Execute verification queries:

**Verification Query 1: Check Policies**
```sql
SELECT * FROM pg_policies WHERE tablename IN ('notes', 'links');
```
- [ ] Policies do NOT contain `00000000-0000-0000-0000-000000000000`
- [ ] Policy names are correct (`"Users can CRUD their own notes"`, etc.)
- [ ] Policy logic uses `auth.uid()` only (no hardcoded UUID)

**Verification Query 2: Check Prototype User Deleted**
```sql
SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
```
- [ ] Returns 0 rows (user deleted)

**Verification Query 3: Check for Orphaned Data**
```sql
-- Should return 0 rows (CASCADE should have cleaned up)
SELECT COUNT(*) FROM notes WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
SELECT COUNT(*) FROM links WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
```
- [ ] Both queries return 0

### Task 1.4: Cross-User Isolation Testing (15 min)
- [ ] Login as User A in dev environment
- [ ] Create 2-3 journal entries
- [ ] Create 1-2 notes
- [ ] Note IDs created by User A
- [ ] Logout

- [ ] Login as User B
- [ ] Verify cannot see User A's journal entries
- [ ] Verify cannot see User A's notes
- [ ] Attempt direct API call to User A's note ID (should return 403)
- [ ] Create User B's own journal entry
- [ ] Logout

- [ ] Login as User A again
- [ ] Verify User A's data still intact
- [ ] Verify cannot see User B's data

**Test Results:**
- [ ] User A cannot access User B's data
- [ ] User B cannot access User A's data
- [ ] API returns 403 Forbidden for unauthorized access
- [ ] Data isolation 100% confirmed

---

## Phase 2: Implement Structured Logging (HIGH - 2-3 hours)

### Task 2.1: Install Pino (5 min)
- [ ] Run: `npm install pino pino-pretty`
- [ ] Verify packages added to package.json
- [ ] Run: `npm install` to ensure clean install
- [ ] Commit package.json and package-lock.json

### Task 2.2: Create Logger Utility (10 min)
- [ ] Create file: `src/utils/logger.ts`
- [ ] Import pino
- [ ] Configure logger with environment-based levels
- [ ] Configure pino-pretty for development
- [ ] Configure JSON output for production
- [ ] Add formatters for consistent output
- [ ] Export default logger
- [ ] Test import in one file (verify no errors)
- [ ] Commit logger.ts

**Logger Configuration Checklist:**
- [ ] LOG_LEVEL environment variable support
- [ ] Development mode: pretty-printing enabled
- [ ] Production mode: JSON output
- [ ] Level formatting included
- [ ] Proper TypeScript types

### Task 2.3: Migrate API Routes to Pino (1.5-2 hours)

#### Route 1: transfer-guest-content (15 min)
- [ ] Open `src/app/api/transfer-guest-content/route.ts`
- [ ] Import logger: `import logger from '@/utils/logger'`
- [ ] Replace console.log with logger.debug/info
- [ ] Replace console.error with logger.error
- [ ] Add context fields (userId, route, etc.)
- [ ] Test route locally
- [ ] Commit changes

**Before/After Examples:**
- [ ] Line 12: console.error → logger.error
- [ ] Line 46: console.error → logger.error
- [ ] Line 53: console.log → logger.debug (sensitive - user ID)
- [ ] Line 91: console.error → logger.error

#### Route 2: extract-ontology (15 min)
- [ ] Open `src/app/api/extract-ontology/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 3: ontology/analysis-state (10 min)
- [ ] Open `src/app/api/ontology/analysis-state/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 4: ontology/incremental-analysis (15 min)
- [ ] Open `src/app/api/ontology/incremental-analysis/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 5: tasks/[taskId] (10 min)
- [ ] Open `src/app/api/tasks/[taskId]/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 6: tasks/bulk (10 min)
- [ ] Open `src/app/api/tasks/bulk/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 7: tasks/parse (10 min)
- [ ] Open `src/app/api/tasks/parse/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 8: transcribe (10 min)
- [ ] Open `src/app/api/transcribe/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

#### Route 9: import/obsidian (10 min)
- [ ] Open `src/app/api/import/obsidian/route.ts`
- [ ] Import logger
- [ ] Replace all console.log/error statements
- [ ] Add context fields
- [ ] Test route locally
- [ ] Commit changes

### Task 2.4: Verify No Console.log Remains (10 min)
- [ ] Search codebase: `grep -r "console.log" src/app/api/`
- [ ] Search codebase: `grep -r "console.error" src/app/api/`
- [ ] Verify only intentional logging remains (if any)
- [ ] Document any exceptions

### Task 2.5: Configure Environment Variables (5 min)
- [ ] Add to `.env.local`: `LOG_LEVEL=debug`
- [ ] Add to Vercel dev environment: `LOG_LEVEL=debug`
- [ ] Add to Vercel production environment: `LOG_LEVEL=info`
- [ ] Verify environment variables set
- [ ] Document in `.env.example` if exists

### Task 2.6: Test Logging Locally (10 min)
- [ ] Run dev server: `npm run dev`
- [ ] Trigger each API route
- [ ] Verify pretty-printed logs appear in console
- [ ] Check log format and readability
- [ ] Change `LOG_LEVEL=info` and verify debug logs hidden
- [ ] Run build: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Verify JSON log output format
- [ ] Stop server

**Log Output Verification:**
- [ ] Development: Pretty-printed, colorized logs
- [ ] Development: DEBUG level messages visible
- [ ] Production simulation: JSON format
- [ ] Production simulation: DEBUG level hidden
- [ ] All logs include context fields (route, userId, etc.)

---

## Phase 3: Security Verification (CRITICAL - 1 hour)

### Task 3.1: Complete Migration Verification (15 min)
- [ ] Verify migration applied to dev environment
- [ ] Re-run all verification queries from Task 1.3
- [ ] Document results in verification log
- [ ] Take screenshots of policy queries for PR
- [ ] Confirm seed script updated and tested

### Task 3.2: Complete Auth Flow Testing (30 min)

#### Guest Mode & Signup
- [ ] Open app in incognito window
- [ ] Verify guest journaling works (Story 1.8)
- [ ] Write test content in guest mode
- [ ] Click sign-up
- [ ] Complete signup form
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Verify redirected to app
- [ ] Verify guest content transferred

#### Password Reset Flow
- [ ] Logout
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Set new password
- [ ] Login with new password
- [ ] Verify successful

#### Multi-Device Access
- [ ] Login on Browser A
- [ ] Create journal entry
- [ ] Open same account on Browser B
- [ ] Verify journal entry appears
- [ ] Edit entry on Browser B
- [ ] Refresh Browser A
- [ ] Verify edit synced

#### Session Persistence
- [ ] Login
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close browser tab
- [ ] Reopen app URL
- [ ] Verify still logged in (within session timeout)

#### Sign Out
- [ ] Click sign out button
- [ ] Verify redirected to auth page
- [ ] Verify cannot access protected routes
- [ ] Verify session cleared

**Auth Flow Results:**
- [ ] All flows tested successfully
- [ ] No errors or broken states
- [ ] Session handling correct
- [ ] Data persistence working

### Task 3.3: Final Cross-User Verification (15 min)
- [ ] Re-test User A / User B isolation
- [ ] Attempt API calls with invalid tokens
- [ ] Verify 401/403 responses
- [ ] Test RLS enforcement at database level
- [ ] Document all verification results

---

## Phase 4: Documentation & Deployment (30 min)

### Task 4.1: Update Story Documentation (10 min)
- [ ] Mark Story 2.4.6 as ✅ COMPLETED in `docs/stories/STORY_INDEX.md`
- [ ] Add completion date
- [ ] Add PR number (when available)
- [ ] Move story to completed section
- [ ] Update "Last Updated" date

### Task 4.2: Document Security Baseline (10 min)
- [ ] Create or update security documentation
- [ ] Document RLS policy structure
- [ ] Document verification process
- [ ] Add screenshots of verification queries
- [ ] Note any lessons learned

### Task 4.3: Update Architecture Docs (5 min)
- [ ] Add logging guidelines to coding standards (if exists)
- [ ] Document log levels and when to use them
- [ ] Add examples of good logging practices
- [ ] Update source tree if logger utility not documented

### Task 4.4: Create PR (5 min)
- [ ] Create feature branch if not already done
- [ ] Ensure all commits have clear messages
- [ ] Push branch to GitHub
- [ ] Create PR with template
- [ ] Fill out PR checklist
- [ ] Add security verification results
- [ ] Add before/after screenshots
- [ ] Link to Issue #118
- [ ] Link to Story 2.4.6
- [ ] Request review

---

## PR Checklist (Copy to PR Description)

```markdown
## Story 2.4.6: Production Security Hardening

**GitHub Issue:** #118
**Story Doc:** `docs/stories/story-2.4.6-production-security-hardening.md`

### Changes Made

#### Phase 1: Remove Prototype User (CRITICAL)
- [ ] Created migration: `supabase/migrations/[timestamp]_remove_prototype_user.sql`
- [ ] Dropped and recreated RLS policies without prototype UUID
- [ ] Deleted prototype user from auth.users
- [ ] Updated seed script to accept user ID parameter
- [ ] Verified no hardcoded UUID references remain

#### Phase 2: Implement Structured Logging (HIGH)
- [ ] Installed Pino logging library
- [ ] Created logger utility: `src/utils/logger.ts`
- [ ] Migrated 9 API routes to Pino logging
- [ ] Configured environment-based log levels
- [ ] Verified no console.log statements remain in API routes

#### Phase 3: Security Verification
- [ ] Migration tested in dev environment
- [ ] Cross-user isolation verified (User A / User B)
- [ ] Complete auth flow tested
- [ ] RLS policies verified via SQL
- [ ] Prototype user confirmed deleted

#### Phase 4: Documentation
- [ ] Updated STORY_INDEX.md
- [ ] Documented security baseline
- [ ] Updated architecture/coding standards
- [ ] Linked Issue #118

### Security Verification Results

**Policy Verification:**
```sql
SELECT * FROM pg_policies WHERE tablename IN ('notes', 'links');
```
- [ ] Screenshot attached
- [ ] No prototype UUID in policies
- [ ] Correct policy names confirmed

**Prototype User Verification:**
```sql
SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
```
- [ ] Returns 0 rows (deleted)

**Cross-User Isolation:**
- [ ] User A cannot access User B's data
- [ ] User B cannot access User A's data
- [ ] API returns 403 for unauthorized access
- [ ] Screenshots attached

**Auth Flow Testing:**
- [ ] Guest signup flow works
- [ ] Password reset works
- [ ] Multi-device sync works
- [ ] Session persistence works
- [ ] Sign out clears session

### Build & Test Status
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] Logging tested in dev mode
- [ ] Logging tested in production mode
- [ ] All API routes functional

### Deployment Plan
- [ ] Deploy to dev environment first
- [ ] Run verification checklist in dev
- [ ] Deploy to production
- [ ] Run verification checklist in production
- [ ] Monitor logs for 24 hours

### Rollback Plan
- [ ] Supabase automatic backups available
- [ ] Git revert ready if needed
- [ ] No data loss risk (prototype UUID unused by real users)

### Closes
- Closes #118
```

---

## Post-Deployment Verification (After Production Deploy)

### Immediate Checks (5 min)
- [ ] Production deployment successful
- [ ] Health check endpoint responds
- [ ] Can login to production app
- [ ] Can create journal entry

### Policy Verification in Production (10 min)
- [ ] Connect to production Supabase
- [ ] Run policy verification queries
- [ ] Confirm prototype user deleted
- [ ] Verify RLS policies correct
- [ ] Document results

### Logging Verification in Production (15 min)
- [ ] Check Vercel logs
- [ ] Verify structured JSON logs
- [ ] Verify LOG_LEVEL=info (no debug logs)
- [ ] Trigger test API calls
- [ ] Verify logs contain context fields
- [ ] No sensitive data exposed in logs

### Cross-User Test in Production (30 min)
- [ ] Create test User A
- [ ] Create test User B
- [ ] Perform isolation tests
- [ ] Verify cannot access each other's data
- [ ] Clean up test accounts

### Monitor for 24 Hours
- [ ] Check error rates in Vercel
- [ ] Review log patterns
- [ ] Watch for any security alerts
- [ ] Monitor user feedback
- [ ] Document any issues

---

## Rollback Procedure (If Needed)

### If Migration Fails:
1. [ ] Do NOT deploy to production
2. [ ] Review migration error logs
3. [ ] Fix migration file
4. [ ] Re-test in dev environment
5. [ ] Update PR with fixes

### If Production Issues Occur:
1. [ ] Immediately alert team
2. [ ] Check Vercel logs for errors
3. [ ] If critical: revert deployment via Vercel dashboard
4. [ ] If needed: restore Supabase backup (contact Supabase support)
5. [ ] Document incident
6. [ ] Create hotfix plan

---

## Completion Checklist

- [ ] All phases completed
- [ ] PR merged to main
- [ ] Production deployment successful
- [ ] Post-deployment verification passed
- [ ] 24-hour monitoring complete
- [ ] GitHub Issue #118 closed
- [ ] Story 2.4.6 marked complete
- [ ] Team notified of launch readiness
- [ ] Security baseline documented
- [ ] Lessons learned captured

---

**Estimated Total Time:** 3.5-4.5 hours (or 45-60 min for Phase 1 only)
**Critical Path:** Phase 1 must complete before launch
**Nice to Have:** Phases 2-4 can follow shortly after

**Created:** 2025-11-03
**Status:** Ready for execution
