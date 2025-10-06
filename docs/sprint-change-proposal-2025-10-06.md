# Sprint Change Proposal
## Epic 4 Course Correction - Auth Integration & Deployment Model Fix

**Date:** 2025-10-06
**Triggered By:** PR #3 Review - P0 Security Issue (Comment #2404742346)
**Current Branch:** `story-2.4-ux-correction`
**Status:** APPROVED
**Approved By:** User

---

## Executive Summary

**Issue:** Story 2.4 Supabase migration introduced a P0 privacy vulnerability by using a shared `PROTOTYPE_USER_ID` that exposes all user data publicly. The root cause was a deployment model misalignment - the code assumed a "prototype phase" environment that doesn't exist in our GitHub→Vercel auto-deploy workflow.

**Impact:** PR #3 cannot merge to production. Story 2.4 (AI Ontology Extraction) is 80% complete but blocked.

**Solution:** Split Story 2.4 into 3 sequential stories, create persistent dev environment, and complete auth integration that was partially implemented in Story 1.3.

**Timeline Impact:** +6-10 hours (Stories 2.4.0 and 2.4.1)

---

## Analysis Summary

### Root Cause

The migration was **technically correct but strategically wrong** for our deployment model:

1. **Deployment Model Mismatch:** Assumed a "prototype phase" environment that doesn't exist
   - Current: `main` branch → auto-deploys to public production URL
   - Assumed: Persistent dev environment where shared data is acceptable

2. **Incomplete Story 1.3:** Authentication infrastructure exists (UI, context, forms) but was never integrated with data layer
   - Auth UI: ✅ Complete
   - Route protection: ❌ Not implemented
   - Notes CRUD with auth: ❌ Still uses PROTOTYPE_USER_ID
   - RLS policies: ❌ Allow unauthenticated access

3. **Process Gap:** No security review checkpoint caught privacy regression before implementation

### Epic Impact

**Epic 1 (Foundation):**
- Story 1.3 marked complete but auth integration incomplete
- **Action:** Reopen Story 1.3 work as part of new Story 2.4.1

**Epic 4 (AI Ontology):**
- Story 2.4 needs split into 3 stories
- Dependencies created: 2.4.0 → 2.4.1 → 2.4.2
- No epic reordering needed

### Artifact Impact

| Document | Changes Required |
|----------|-----------------|
| `docs/prd.md` | - Add changelog entry<br>- Update Epic 4 with 3 stories<br>- Mark Story 1.3 partial<br>- Clarify auth status |
| `.claude/CLAUDE.md` | - Add dev environment section<br>- Document dev vs prod deployment model<br>- Remove "PR preview only" language |
| `docs/story-2.4-updated.md` | - Rename to `story-2.4.2-ontology-extraction.md`<br>- Remove PROTOTYPE_USER section<br>- Add prerequisites |
| **New:** `docs/story-2.4.0-dev-environment.md` | Create new story document |
| **New:** `docs/story-2.4.1-auth-integration.md` | Create new story document |

---

## Recommended Path Forward

**Selected Option:** Direct Adjustment / Integration (Option 1)

**Execution Strategy:**
- ✅ Sequential implementation (2.4.0 → 2.4.1 → 2.4.2)
- ✅ Separate PRs for each story (cleaner reviews)
- ✅ Same Supabase project for dev and prod
- ✅ Decimal story numbering

---

## Implementation Plan

### Phase 1: Close PR #3 & Update Documentation
**Owner:** Claude Code
**Timeline:** Immediate

**Tasks:**
1. Close PR #3 with explanatory comment
2. Update PRD with changelog and story splits
3. Create story documents: 2.4.0, 2.4.1, and rename 2.4.2
4. Update CLAUDE.md with deployment model

**PR #3 Close Comment:**
```
Closing this PR due to P0 security issue identified in review.

The Supabase migration work is solid, but needs prerequisite infrastructure:
1. Dev environment setup (Story 2.4.0)
2. Complete auth integration (Story 2.4.1)

This PR will be superseded by 3 separate PRs:
- Story 2.4.0 - Dev Environment Setup
- Story 2.4.1 - Auth Integration
- Story 2.4.2 - Ontology Extraction

See: docs/sprint-change-proposal-2025-10-06.md
```

---

### Phase 2: Story 2.4.0 - Dev Environment Setup
**Owner:** Developer (with Claude Code assist)
**Timeline:** ~2-4 hours
**Branch:** `story-2.4.0-dev-environment`

**Acceptance Criteria:**
1. ✅ `dev` branch created in GitHub and protected
2. ✅ Separate Vercel project configured for `dev` branch
3. ✅ Dev environment URL: `dev.ontology-mu.vercel.app` (or similar)
4. ✅ Environment variables documented for dev vs prod
5. ✅ CLAUDE.md updated with deployment model documentation
6. ✅ Dev environment uses same Supabase project (different test users)
7. ✅ Vercel auto-deploys `dev` branch on push
8. ✅ PR preview deployments still work for feature branches

**Implementation Steps:**

1. **Git Branch Setup**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b dev
   git push -u origin dev
   ```

2. **Vercel Configuration**
   - Go to Vercel dashboard
   - Create new project or add branch to existing
   - Link to `dev` branch
   - Configure auto-deploy on push
   - Set custom domain (if available)
   - Copy environment variables from production

3. **CLAUDE.md Updates**

   Add new section after line 48 ("Currently: Using PR preview deployments only"):

   ```markdown
   ## Development Environments

   **Dev Environment (`dev` branch)**
   - URL: https://dev.ontology-mu.vercel.app
   - Purpose: Persistent testing with production-like config
   - Auth: Real Supabase Auth (create test accounts)
   - Data: Same Supabase project, separate test users
   - Auto-deploys: On push to `dev` branch

   **Production Environment (`main` branch)**
   - URL: https://ontology-mu.vercel.app
   - Purpose: Production-ready releases only
   - Auth: Real Supabase Auth
   - Data: Same Supabase project, real users
   - Auto-deploys: On merge to `main`

   **PR Preview Deployments**
   - URL: Ephemeral (provided by Vercel bot)
   - Purpose: Feature testing before merge
   - Lifetime: Exists while PR is open
   - Use for: Quick feature validation

   ## Development Workflow

   1. Develop features on feature branches (off `dev`)
   2. Test locally with `npm run dev`
   3. Create PR targeting `dev` branch
   4. Test on PR preview deployment
   5. Merge to `dev` for persistent testing
   6. When feature is production-ready, create PR from `dev` → `main`
   7. Final testing on main's PR preview, then merge to production
   ```

4. **Create Story Document**

   File: `docs/story-2.4.0-dev-environment.md`

   (Full content provided in Sprint Change Proposal Section 5, subsection 2)

5. **Testing**
   - Push a test commit to `dev` branch
   - Verify Vercel auto-deploys
   - Access dev URL and verify app loads
   - Create feature branch and PR to `dev`
   - Verify PR preview still generates

---

### Phase 3: Story 2.4.1 - Auth Integration
**Owner:** Developer (with Claude Code assist)
**Timeline:** ~4-6 hours
**Branch:** `story-2.4.1-auth-integration`

**Acceptance Criteria:**

1. **Route Protection**
   - Main pages (`/`, `/notes`, `/notes/[id]`) require authentication
   - Unauthenticated users redirected to `/auth`
   - Authenticated users redirected from `/auth` to `/`
   - Loading states shown during auth check

2. **Notes CRUD Auth Integration**
   - Remove `PROTOTYPE_USER_ID` constant from `src/lib/notes.ts`
   - Update all CRUD functions to use authenticated user ID
   - All database operations filter/set by `auth.uid()`

3. **RLS Policy Updates**
   - Remove prototype user policy migration
   - Create new migration: `20251006000000_enforce_auth.sql`
   - Enforce `auth.uid() = user_id` for all operations
   - Test multi-user data isolation

**Implementation Steps:**

1. **Update `src/lib/notes.ts`**

   ```typescript
   // Remove this line:
   // const PROTOTYPE_USER_ID = '00000000-0000-0000-0000-000000000000'

   // Add helper function:
   async function getCurrentUserId(): Promise<string> {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) throw new Error('User not authenticated')
     return user.id
   }

   // Update getNotes():
   export async function getNotes(): Promise<Note[]> {
     try {
       const userId = await getCurrentUserId()
       const [journal, regular, ontology] = await Promise.all([
         supabaseNotes.getJournalEntries(userId),
         supabaseNotes.getRegularNotes(userId),
         supabaseNotes.getOntologyNotes(userId)
       ])
       return [...journal, ...regular, ...ontology]
     } catch (error) {
       console.error('Error loading notes from Supabase:', error)
       return []
     }
   }

   // Update createNote():
   export async function createNote(request: CreateNoteRequest): Promise<Note> {
     const userId = await getCurrentUserId()
     return await supabaseNotes.createNote(request, userId)
   }

   // Apply same pattern to updateNote, deleteNote, getNoteById, etc.
   ```

2. **Add Route Protection**

   Update `src/app/page.tsx`:
   ```typescript
   'use client'

   import { useAuth } from '@/contexts/AuthContext'
   import { useRouter } from 'next/navigation'
   import { useEffect } from 'react'

   export default function Home() {
     const { user, loading } = useAuth()
     const router = useRouter()

     useEffect(() => {
       if (!loading && !user) {
         router.push('/auth')
       }
     }, [user, loading, router])

     if (loading) {
       return (
         <div className="flex items-center justify-center min-h-screen">
           <div className="text-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-muted-foreground">Loading...</p>
           </div>
         </div>
       )
     }

     if (!user) return null

     // ... rest of component
   }
   ```

   Apply same pattern to:
   - `src/app/notes/page.tsx`
   - `src/app/notes/[id]/page.tsx`

3. **Create RLS Migration**

   File: `supabase/migrations/20251006000000_enforce_auth.sql`

   ```sql
   -- Remove prototype user policies
   DROP POLICY IF EXISTS "Allow prototype user CRUD without auth" ON notes;
   DROP POLICY IF EXISTS "Allow prototype user links CRUD without auth" ON links;

   -- Enforce authenticated access for notes
   CREATE POLICY "Users can only access own notes"
     ON notes FOR ALL
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Enforce authenticated access for links
   CREATE POLICY "Users can only access own links"
     ON links FOR ALL
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Optional: Delete prototype user (if exists)
   DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
   ```

   Apply migration:
   ```bash
   # If using Supabase CLI
   supabase db push

   # Or apply via Supabase Dashboard → SQL Editor
   ```

4. **Testing in Dev Environment**

   - Deploy to `dev` branch
   - Create test user account #1 in dev
   - Sign in and create journal entry
   - Verify entry saved with correct user_id
   - Sign out, create test user account #2
   - Verify user #2 cannot see user #1's entries
   - Test RLS policies block unauthorized access

5. **Create Story Document**

   File: `docs/story-2.4.1-auth-integration.md`

   (Full content provided in Sprint Change Proposal Section 5, subsection 3)

---

### Phase 4: Story 2.4.2 - Ontology Extraction
**Owner:** Developer (with Claude Code assist)
**Timeline:** ~2 hours (mostly done, just final testing)
**Branch:** `story-2.4.2-ontology-extraction`

**Tasks:**
1. Rename `docs/story-2.4-updated.md` → `docs/story-2.4.2-ontology-extraction.md`
2. Update file with prerequisites (2.4.0 and 2.4.1)
3. Remove "Supabase Migration" and "Auth Handling" sections
4. Cherry-pick ontology extraction commits from closed PR #3
5. Test on dev environment with authenticated users
6. Verify ontology cards populate correctly
7. Create PR targeting `dev`, review, merge
8. Final testing, then create PR from `dev` → `main`

---

## PRD Updates

**File:** `docs/prd.md`

### Update Current Status (around line 26-37)

```diff
 **Deployment Status:** ✅ **LIVE IN PRODUCTION**
 - **Production URL:** https://ontology-mu.vercel.app
+- **Dev URL:** https://dev.ontology-mu.vercel.app
 - **GitHub Repository:** https://github.com/levineam/Signum
 - **Deployment Pipeline:** Automated via GitHub → Vercel integration

 **Technical Architecture:**
 - **Framework:** Next.js 15.5.3 with Turbopack
-- **Authentication:** Supabase Auth with email/password
+- **Authentication:** Supabase Auth with email/password (UI complete, data layer integration in progress - Story 2.4.1)
 - **Database:** Supabase PostgreSQL
```

### Update Next Priorities (around line 50-51)

```diff
 **Next Priorities:**
-1. **Story 2.4**: AI Personal Ontology Extraction with GPT-5-mini (Supabase foundation ready)
+1. **Story 2.4.0**: Dev Environment Setup
+2. **Story 2.4.1**: Complete Auth Integration
+3. **Story 2.4.2**: AI Personal Ontology Extraction with GPT-5-mini
```

### Add Changelog Entry (after line 57)

```diff
 | Date | Version | Description | Author |
 |------|---------|-------------|---------|
+| 2025-10-06 | 3.5 | **COURSE CORRECTION:** PR #3 review revealed P0 security issue (shared PROTOTYPE_USER_ID exposing all user data publicly). Root cause: deployment model mismatch - code assumed "prototype phase" that doesn't exist. Split Story 2.4 into 3 sequential stories: 2.4.0 (Dev Environment Setup), 2.4.1 (Complete Auth Integration), 2.4.2 (Ontology Extraction). Created persistent dev environment. Completed auth integration from partial Story 1.3. See `docs/sprint-change-proposal-2025-10-06.md` | John (PM) |
 | 2025-10-05 | 3.4 | **SCOPE EXPANSION:** Story 2.4 expanded to include Supabase migration...
```

### Update Epic 4 Section (around line 923+)

Add before existing Story 2.4 content:

```markdown
#### Story 2.4.0: Dev Environment Setup ✅ NEXT

As a developer,
I want a persistent development environment with production-like configuration,
so that I can test features with real authentication before deploying to production.

##### Acceptance Criteria
1. `dev` branch created and protected in GitHub
2. Separate Vercel project configured for `dev` branch
3. Dev environment accessible at persistent URL (dev.ontology-mu.vercel.app)
4. CLAUDE.md documents deployment model (dev vs prod vs PR previews)
5. Workflow clear: feature → PR to dev → test → PR to main
6. Environment variables documented
7. Same Supabase project used for both environments

##### Implementation Details
See `docs/story-2.4.0-dev-environment.md`

---

#### Story 2.4.1: Complete Auth Integration ✅ NEXT

As a user,
I want my journal entries and notes to be private and secure,
so that only I can access my personal reflections.

##### Acceptance Criteria
1. Main pages require authentication (redirect to /auth if not logged in)
2. Notes CRUD functions use authenticated user ID (not PROTOTYPE_USER_ID)
3. RLS policies enforce `auth.uid() = user_id` for all data access
4. PROTOTYPE_USER_ID removed entirely from codebase
5. Multi-user testing confirms data isolation in dev environment
6. Route protection implemented on all main pages
7. Loading states shown during auth verification

##### Context
**Completes auth integration from Story 1.3 (Epic 1)**

Story 1.3 implemented auth UI (forms, context, providers) but never integrated with the data layer. This story completes the integration.

**What Already Exists:**
- ✅ AuthContext with Supabase Auth
- ✅ Sign in/sign up/password reset forms
- ✅ `/auth` page with routing
- ✅ AuthProvider in root layout
- ✅ Sidebar displays user email and sign out

**What's Missing (This Story):**
- ❌ Route protection on main pages
- ❌ Notes CRUD using authenticated user
- ❌ RLS policies enforcing auth

##### Implementation Details
See `docs/story-2.4.1-auth-integration.md`

---

#### Story 2.4.2: Personal Ontology Extraction Foundation

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from **all my notes**,
so that I can build a structured personal ontology that helps me understand my authentic self.

##### Prerequisites
- Story 2.3.5 (Notes Page UI) ✅ Complete
- Story 2.4.0 (Dev Environment Setup) ⏸️ Pending
- Story 2.4.1 (Auth Integration) ⏸️ Pending

##### Acceptance Criteria
[Keep existing criteria from Story 2.4]

##### Implementation Details
See `docs/story-2.4.2-ontology-extraction.md`
```

### Update Story 1.3 Status (around line 263-277)

Add after existing acceptance criteria:

```markdown
##### Status: PARTIALLY COMPLETE

**Completed in Epic 1:**
- ✅ Supabase Auth integration with email/password signup and login
- ✅ User session management across page refreshes
- ✅ Password reset functionality
- ✅ Authentication UI (forms, context, providers)
- ✅ AuthProvider in root layout
- ✅ Sidebar shows user email and sign out

**Remaining Work (completed in Story 2.4.1, Epic 4):**
- Route protection for unauthenticated users
- Notes CRUD integration with authenticated user
- RLS policies enforcing authentication
- PROTOTYPE_USER_ID removal

**Completion:** Story 2.4.1 will complete this work
```

---

## Success Criteria

**This course correction is successful when:**

1. ✅ Dev environment operational at persistent URL
2. ✅ Auth fully integrated (no PROTOTYPE_USER_ID references)
3. ✅ Multi-user testing confirms data isolation
4. ✅ Ontology extraction working with authenticated users
5. ✅ PR #3 P0 issue resolved
6. ✅ Deployment model documented and understood
7. ✅ Process improvements prevent similar issues (security checklist in PRs)

---

## Process Improvements

Based on this incident, implement these safeguards:

### 1. Security Review Checklist (Add to PR Template)

```markdown
## Security Review
- [ ] No regression in data isolation/privacy
- [ ] Authentication enforced for sensitive data
- [ ] RLS policies reviewed (if applicable)
- [ ] Secrets/keys not exposed to client
- [ ] Deployment environment appropriate for code changes
```

### 2. CLAUDE.md Updates

- ✅ Define "prototype" clearly (local dev only, never merged to main)
- ✅ Mandate Vercel preview testing for security-sensitive changes
- ✅ Add security requirements to acceptance criteria template

### 3. Story Acceptance Criteria Template

For data-related stories, always include:
1. Functional requirements
2. **Security requirements** (privacy, isolation, auth)
3. Performance requirements

---

## Next Steps

### Immediate (Today)
1. ✅ Claude Code: Close PR #3 with comment
2. ✅ Claude Code: Create this proposal document
3. ⏸️ Claude Code: Update PRD with changes above
4. ⏸️ Claude Code: Update CLAUDE.md with deployment model
5. ⏸️ Claude Code: Create story documents (2.4.0, 2.4.1)
6. ⏸️ Claude Code: Rename story-2.4-updated.md → story-2.4.2-ontology-extraction.md

### Story 2.4.0 (Next ~2-4 hours)
1. Create `dev` branch
2. Configure Vercel for `dev` branch
3. Test dev deployment
4. Create PR, review, merge

### Story 2.4.1 (Next ~4-6 hours)
1. Remove PROTOTYPE_USER_ID
2. Add route protection
3. Update RLS policies
4. Test multi-user in dev
5. Create PR, review, merge to dev
6. Merge dev → main after final testing

### Story 2.4.2 (Next ~2 hours)
1. Cherry-pick ontology work
2. Test in dev with auth
3. Create PR, review, merge to dev
4. Merge dev → main

---

**End of Sprint Change Proposal**

Approved: 2025-10-06
Approved By: User
