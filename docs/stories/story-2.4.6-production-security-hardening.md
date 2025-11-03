# Story 2.4.6: Production Security Hardening & Logging Infrastructure

**Status:** 📋 PLANNED
**Priority:** P0 (Launch Blocker - Critical Security)
**Created:** 2025-11-03
**GitHub Issue:** [#118](https://github.com/levineam/Signum/issues/118)
**Prerequisites:**
- Story 2.4.0 (Dev Environment Setup) ✅ Complete
- Story 2.4.1 (Auth Integration) ✅ Complete
- Story 2.4.2 (Link Migration) ✅ Complete

---

## Story

As a product owner preparing to invite users to Signum,
I want all prototype/testing backdoors removed and production-grade logging in place,
so that user data is secure and the system is observable in production.

---

## Problem Statement

A comprehensive security audit (Issue #118) revealed that while the app is 95% production-ready, **one critical security issue remains** along with logging/observability gaps:

### Critical Security Issue (P0 - Launch Blocker)
- **Prototype User Backdoor:** Database still contains policies allowing unrestricted access via UUID `00000000-0000-0000-0000-000000000000`
- **Location:**
  - Policies: `supabase/migrations/20251015090000_security_performance_remediation.sql` (lines 145-158, 164-177)
  - Auth user: `supabase/migrations/20251005000000_prototype_user_policy.sql` (lines 7-43)
- **Impact:** Potential data exposure if UUID is discovered by malicious actor
- **Risk:** Marked TEMPORARY during development but never fully removed

### Production Observability Gap (P1 - High Priority)
- **Debug Logging:** 20+ `console.log` statements across 9 API routes expose internal logic to production logs
- **No Structure:** Logs lack context, severity levels, and searchability
- **Performance:** console.log slower than structured logging libraries
- **Monitoring:** Cannot integrate with observability platforms (Datadog, Sentry)

### Additional Issues
- **Seed Script:** `scripts/seed-sample-journal-entries.ts:17` hardcodes prototype UUID
- **No Verification Process:** Missing checklist to confirm security fixes are complete

---

## Goals

1. **Remove all prototype user access paths** (policies, auth user, seed scripts)
2. **Implement production-grade structured logging** with proper log levels
3. **Create verification checklist** to prove security isolation works
4. **Document security baseline** for future audits

---

## Scope

### In Scope
- Create database migration to remove prototype user policies and auth user
- Update seed script to accept user ID parameter (remove hardcoded UUID)
- Implement Pino logging library across all API routes
- Add environment-based log level configuration
- Create security verification checklist
- Document logging patterns for future development

### Out of Scope
- Rate limiting (post-launch enhancement)
- Advanced monitoring integrations (Datadog, Sentry) - foundation only
- Additional security features beyond audit findings
- Complete auth flow redesign

---

## Acceptance Criteria

### Phase 1: Remove Prototype User (CRITICAL)
1. New migration file created: `supabase/migrations/[timestamp]_remove_prototype_user.sql`
2. Migration drops and recreates RLS policies WITHOUT prototype UUID clause:
   - `"Notes owner or prototype access"` → `"Users can CRUD their own notes"`
   - `"Links owner or prototype access"` → `"Users can CRUD their own links"`
3. Migration deletes prototype user from `auth.users` (CASCADE removes associated data)
4. Migration includes verification assertion (fails if user still exists)
5. Seed script updated to accept user ID parameter instead of hardcoded UUID
6. All references to `00000000-0000-0000-0000-000000000000` removed from codebase

### Phase 2: Implement Structured Logging (HIGH)
1. Pino logging library installed (`pino`, `pino-pretty`)
2. Logger utility created at `src/utils/logger.ts` with:
   - Environment-based log levels (debug in dev, info in production)
   - Pretty-printing in development, JSON in production
   - Consistent formatting with context fields
3. All `console.log` and `console.error` replaced with appropriate log levels:
   - `logger.debug()` - Detailed info (hidden in production)
   - `logger.info()` - Important operations
   - `logger.warn()` - Recoverable issues
   - `logger.error()` - Actual errors
   - `logger.fatal()` - Critical failures
4. Migration completed across all API routes:
   - `src/app/api/transfer-guest-content/route.ts`
   - `src/app/api/extract-ontology/route.ts`
   - `src/app/api/ontology/analysis-state/route.ts`
   - `src/app/api/ontology/incremental-analysis/route.ts`
   - `src/app/api/tasks/[taskId]/route.ts`
   - `src/app/api/tasks/bulk/route.ts`
   - `src/app/api/tasks/parse/route.ts`
   - `src/app/api/transcribe/route.ts`
   - `src/app/api/import/obsidian/route.ts`
5. Environment variable `LOG_LEVEL` configured in dev and production

### Phase 3: Security Verification (CRITICAL)
1. Verification checklist executed and documented:
   - [ ] Migration applied to dev environment
   - [ ] Policies verified via SQL: `SELECT * FROM pg_policies WHERE tablename IN ('notes', 'links')`
   - [ ] Prototype user confirmed deleted: `SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid` returns 0 rows
   - [ ] Cross-user isolation tested (2 test accounts cannot access each other's data)
   - [ ] Seed script no longer references prototype UUID
   - [ ] Build passes with new logging
   - [ ] Dev environment logs show structured JSON in production mode
   - [ ] Migration applied to production
   - [ ] Production policies re-verified
2. Security verification results documented in PR
3. Complete auth flow tested:
   - Guest mode → sign-up → email verification → sign-in
   - Guest content transfer after signup
   - Password reset flow
   - Multi-device access
   - Session persistence
   - Sign out functionality

### Phase 4: Documentation Updates
1. Story 2.4.6 marked complete in `docs/stories/STORY_INDEX.md`
2. Security baseline documented for future audits
3. Logging patterns documented in architecture or coding standards
4. PR template updated with security verification checklist (if not already present)
5. GitHub Issue #118 closed with reference to merged PR

---

## Implementation Plan

### Phase 1: Remove Prototype User (45-60 min)

#### Task 1.1: Create Migration File (15 min)
```sql
-- supabase/migrations/[timestamp]_remove_prototype_user.sql

-- Drop and recreate notes policy WITHOUT prototype UUID
DROP POLICY IF EXISTS "Notes owner or prototype access" ON public.notes;

CREATE POLICY "Users can CRUD their own notes"
  ON public.notes
  FOR ALL
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  );

-- Drop and recreate links policy WITHOUT prototype UUID
DROP POLICY IF EXISTS "Links owner or prototype access" ON public.links;

CREATE POLICY "Users can CRUD their own links"
  ON public.links
  FOR ALL
  TO public
  USING (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR (user_id = (SELECT auth.uid()))
  );

-- Delete prototype user from auth.users (CASCADE removes associated data)
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Verify deletion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Prototype user still exists after deletion';
  END IF;
END $$;

COMMENT ON POLICY "Users can CRUD their own notes" ON public.notes IS
  'Production policy: Users can only access their own notes via RLS';

COMMENT ON POLICY "Users can CRUD their own links" ON public.links IS
  'Production policy: Users can only access their own links via RLS';
```

#### Task 1.2: Update Seed Script (15 min)
Update `scripts/seed-sample-journal-entries.ts`:
- Remove hardcoded `PROTOTYPE_USER_ID` constant
- Accept user ID as command-line parameter or environment variable
- Add validation and documentation
- Update script header with usage instructions

#### Task 1.3: Test Migration in Dev (15 min)
- Apply migration to dev environment
- Run verification queries
- Test with 2 test accounts
- Confirm cross-user isolation

### Phase 2: Implement Logging (2-3 hours)

#### Task 2.1: Install Pino (5 min)
```bash
npm install pino pino-pretty
```

#### Task 2.2: Create Logger Utility (10 min)
Create `src/utils/logger.ts`:
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    }
  }
})

export default logger
```

#### Task 2.3: Migrate API Routes (1.5-2 hours)
Replace console.log/error in each route:

**Before:**
```typescript
console.log('[transfer-guest-content] Authenticated user:', user.id)
console.error('[transfer-guest-content] Auth error:', authError)
```

**After:**
```typescript
import logger from '@/utils/logger'

logger.debug({ userId: user.id, route: 'transfer-guest-content' }, 'User authenticated')
logger.error({ error: authError, route: 'transfer-guest-content' }, 'Authentication failed')
```

**Route Migration Checklist:**
- [ ] `src/app/api/transfer-guest-content/route.ts`
- [ ] `src/app/api/extract-ontology/route.ts`
- [ ] `src/app/api/ontology/analysis-state/route.ts`
- [ ] `src/app/api/ontology/incremental-analysis/route.ts`
- [ ] `src/app/api/tasks/[taskId]/route.ts`
- [ ] `src/app/api/tasks/bulk/route.ts`
- [ ] `src/app/api/tasks/parse/route.ts`
- [ ] `src/app/api/transcribe/route.ts`
- [ ] `src/app/api/import/obsidian/route.ts`

#### Task 2.4: Configure Environment Variables (5 min)
Add to `.env.local` (development):
```env
LOG_LEVEL=debug
```

Add to Vercel Environment Variables (production):
```env
LOG_LEVEL=info
```

#### Task 2.5: Test Logging Locally (10 min)
- Run dev server with `LOG_LEVEL=debug`
- Verify pretty-printed logs appear
- Test with `LOG_LEVEL=info` to confirm filtering
- Build production bundle and verify JSON output

### Phase 3: Security Verification (1 hour)

#### Task 3.1: Run Migration in Dev (15 min)
- Apply migration
- Verify policies via SQL
- Confirm prototype user deleted
- Document results

#### Task 3.2: Cross-User Isolation Testing (30 min)
- Create User A and User B test accounts
- Login as User A, create notes
- Login as User B, verify cannot see User A's data
- Test API endpoints directly (should return 401/403)
- Test seed script with authenticated user ID

#### Task 3.3: Complete Auth Flow Testing (15 min)
- Test guest → signup → email verification
- Test guest content transfer
- Test password reset
- Test multi-device access
- Test session persistence
- Test sign out

### Phase 4: Documentation & Cleanup (30 min)

#### Task 4.1: Update Story Index (5 min)
- Mark Story 2.4.6 as complete
- Add completion date and PR number
- Update story status table

#### Task 4.2: Document Security Baseline (10 min)
- Record verification results
- Document policy structure
- Note logging patterns

#### Task 4.3: Update Architecture Docs (10 min)
- Add logging guidelines to coding standards
- Document log levels and usage patterns
- Add security verification process

#### Task 4.4: Close GitHub Issue (5 min)
- Reference merged PR
- Summarize what was fixed
- Close Issue #118

---

## Testing Plan

### Automated Testing
- Build passes with new logging library
- No TypeScript errors
- All imports resolve correctly
- Migration syntax validated

### Manual Testing (Dev Environment)
1. **Migration Verification:**
   - Run SQL queries to verify policies
   - Confirm prototype user deleted
   - Check for any remaining references to UUID

2. **Cross-User Isolation:**
   - Create 2 test accounts in Supabase
   - Login as User A, create journal entries and notes
   - Login as User B, verify cannot see User A's data
   - Attempt direct API calls with User B's token to User A's data
   - Verify 403 Forbidden responses

3. **Logging Verification:**
   - Trigger various API routes
   - Verify structured logs appear with correct levels
   - Confirm debug logs hidden in production mode
   - Check log format (pretty in dev, JSON in prod)

4. **Auth Flow Testing:**
   - Complete signup flow
   - Test guest content transfer
   - Test password reset
   - Verify multi-device sync
   - Confirm session persistence

### Security Review Checklist
- [ ] No prototype UUID references remain in code
- [ ] RLS policies enforce auth.uid() checks
- [ ] Cross-user isolation verified
- [ ] All API routes require authentication
- [ ] Logging does not expose sensitive data
- [ ] Build passes all tests
- [ ] Dev environment verified
- [ ] Production deployment successful

---

## Dependencies & References

### Code Files
- `supabase/migrations/20251015090000_security_performance_remediation.sql` (current policies)
- `supabase/migrations/20251005000000_prototype_user_policy.sql` (prototype user creation)
- `scripts/seed-sample-journal-entries.ts` (hardcoded UUID)
- `src/app/api/**/*.ts` (9 API routes with console.log)

### Documentation
- GitHub Issue #118 (security audit findings)
- `docs/prd.md` (security requirements)
- `docs/stories/STORY_INDEX.md` (story tracking)
- `.claude/CLAUDE.md` (PR workflow)

### Related Stories
- Story 2.4.0: Dev Environment Setup (prerequisite)
- Story 2.4.1: Auth Integration (prerequisite)
- Story 2.4.2: Link Migration (prerequisite)

---

## Risks & Mitigations

### Risk: Data Loss During Migration
- **Mitigation:** Prototype user has no production data (UUID never used by real users)
- **Mitigation:** Test migration in dev environment first
- **Mitigation:** Supabase automatic backups available if needed

### Risk: Breaking Existing Functionality
- **Mitigation:** Comprehensive testing in dev before production
- **Mitigation:** Deploy during low-traffic window
- **Mitigation:** Keep rollback migration ready if needed

### Risk: Logging Migration Introduces Bugs
- **Mitigation:** Split into multiple PRs if needed
- **Mitigation:** Deploy to dev first, verify behavior
- **Mitigation:** Pino is battle-tested library (low risk)

### Risk: Missing Security Verification Steps
- **Mitigation:** Follow explicit checklist from Issue #118
- **Mitigation:** Document all verification steps in PR
- **Mitigation:** Require security review approval before merge

---

## PR Strategy

### Option 1: Single PR (Recommended for Speed)
**Branch:** `story-2.4.6-security-hardening`
- All changes in one PR
- Atomic deployment
- Faster to production
- **Time:** 3-4.5 hours total

### Option 2: Two PRs (Recommended for Safety)
**PR 1:** `story-2.4.6-phase1-remove-prototype` (CRITICAL)
- Migration file
- Seed script update
- Security verification
- **Time:** 45-60 min
- **Deploy immediately after approval**

**PR 2:** `story-2.4.6-phase2-logging` (HIGH)
- Pino installation
- Logger utility
- API route migration
- **Time:** 2-3 hours
- **Can deploy after PR 1 if needed**

**Recommendation:** Use Option 2 to unblock launch faster. Critical security fix (PR 1) can go live immediately while logging improvements (PR 2) follow shortly after.

---

## Definition of Done

- [ ] Migration removes all prototype user access paths
- [ ] Seed script no longer hardcodes prototype UUID
- [ ] Structured logging implemented across all API routes
- [ ] Security verification checklist completed with passing results
- [ ] Cross-user isolation tested and verified
- [ ] Complete auth flow tested
- [ ] Build passes successfully
- [ ] Dev environment verified
- [ ] Production deployment successful
- [ ] Documentation updated (story index, architecture, security baseline)
- [ ] GitHub Issue #118 closed
- [ ] PR merged to `main` branch
- [ ] Security baseline established for future audits

---

## Success Metrics

1. **Security:** Zero prototype user references remain in codebase or database
2. **Isolation:** Multi-user testing confirms 100% data isolation
3. **Observability:** Structured logs provide actionable insights in production
4. **Performance:** Logging overhead < 5ms per request
5. **Launch:** App ready to invite external users without security concerns

---

## Timeline Estimate

**Total Time:** 3.5-4.5 hours

| Phase | Task | Estimate |
|-------|------|----------|
| 1 | Create migration | 15 min |
| 1 | Update seed script | 15 min |
| 1 | Test migration in dev | 15 min |
| 2 | Install Pino | 5 min |
| 2 | Create logger utility | 10 min |
| 2 | Migrate API routes | 1.5-2 hours |
| 2 | Configure env vars | 5 min |
| 2 | Test logging | 10 min |
| 3 | Verify migration | 15 min |
| 3 | Cross-user testing | 30 min |
| 3 | Auth flow testing | 15 min |
| 4 | Update documentation | 30 min |

**Fast Track (Critical Only):** 45-60 min (Phase 1 only)
**Full Implementation:** 3.5-4.5 hours (All phases)

---

**Created:** 2025-11-03
**Author:** BMad Master (via security audit)
**Related Issue:** [#118](https://github.com/levineam/Signum/issues/118)
