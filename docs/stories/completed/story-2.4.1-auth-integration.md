# Story 2.4.1: Auth Integration Hardening

**Status:** ✅ COMPLETED
**Completed:** 2025-10-06
**Prerequisites:**
- Story 2.3.6 (Unified Note Data Model) ✅ Complete
- Story 2.4.0 (Dev Environment Setup) ✅ Complete

---

## Story

As a signed-in Signum member,
I want my notes and ontology data to stay private to my account at all times,
so that I can trust the product with deeply personal reflections.

---

## Problem Statement

- Story 1.3 delivered Supabase Auth UI but left the data layer tied to a shared `PROTOTYPE_USER_ID`.
- PR #3 demonstrated a blocker: all users would see and modify the same data in production.
- RLS policies exist in Supabase, but the app bypasses them by using hard-coded IDs and unauthenticated API routes.
- We now have a dev environment (Story 2.4.0) where we can complete the auth integration safely before shipping to production.

---

## Goals

1. Remove every dependency on `PROTOTYPE_USER_ID` or anonymous data access.
2. Enforce Supabase RLS in all reads/writes from the frontend and API routes.
3. Require authentication for all app surfaces except onboarding / auth flows.
4. Provide clear UX during auth checks (loading states, redirect timing, error messaging).
5. Deliver multi-user test evidence from the dev environment proving isolation.

---

## Scope

**In Scope**
- Updating client and server data access to use the authenticated Supabase session.
- Strengthening RLS policies and Supabase service code paths.
- Route protection (Next.js middleware or layout guards) for `/notes`, `/`, `/ontology`, `/settings`, etc.
- QA with at least two Supabase users in the dev environment.
- Documentation updates (CLAUDE.md security workflow, PR template checklist, story prerequisites).

**Out of Scope**
- Ontology extraction improvements (Story 2.4.2).
- New auth providers (e.g., OAuth). Stick with email/password for now.
- Broader UX redesign of auth screens.

---

## Acceptance Criteria

1. All data fetching utilities (`src/lib/**`, server actions, API routes) pull the Supabase user ID from the session/context—no hard-coded IDs remain.
2. Route protection is enforced for every authenticated page; unauthenticated visitors are redirected to `/auth` and see a helpful message/state.
3. Supabase RLS policies (`supabase/policies/*.sql`) ensure `auth.uid() = user_id` for notes, links, and ontology tables; policies are verified with SQL tests or Supabase dashboard checks.
4. Unit tests (or integration tests) cover the new auth guard utilities and at least one data access path.
5. QA evidence from dev environment shows two users (User A, User B) cannot see each other’s notes or ontology data.
6. PROTOTYPE helper functions, environment variables, and seed data are removed or replaced with authenticated counterparts.
7. Documentation updated:
   - `.claude/CLAUDE.md` references Story 2.4.1 completion for auth.
   - `docs/prd.md` marks Story 1.3 as partially complete and notes closure via Story 2.4.1.
   - `docs/story-2.4.2-ontology-extraction.md` lists Stories 2.4.0 and 2.4.1 as prerequisites.
8. Security review checklist (added in sprint change proposal) is followed and completed in the PR description.

---

## Implementation Outline

### Phase 1 — Inventory & Cleanup
- Run `rg "PROTOTYPE_USER"` and catalog all usages.
- Remove prototype helpers and replace with authenticated equivalents.
- Update `.env.example` to remove prototype user variables.

### Phase 2 — Authenticated Data Layer
- Update `AuthContext` / Supabase client utilities to expose the active user ID.
- Refactor `src/lib/notes.ts`, `src/lib/supabase/notes.ts`, and related hooks to accept `userId` from session.
- Ensure server components and API routes retrieve the session using Supabase helpers.

### Phase 3 — Route Protection & UX
- Implement guard (middleware, higher-order component, or layout) that redirects unauthenticated traffic to `/auth`.
- Add loading skeleton or spinner while session state resolves.
- Verify that sign-out clears cached data and returns user to `/auth`.

### Phase 4 — Supabase Policy Verification
- Review existing policies in `supabase/migrations/` for notes and links tables.
- Add/adjust policies to require `auth.uid()` where missing.
- Use Supabase SQL editor or tests to confirm unauthorized access is blocked.

### Phase 5 — QA & Documentation
- Create two test accounts in Supabase and populate user-specific notes.
- Perform cross-account checks on dev environment (notes, ontology cards, API responses).
- Update documentation listed in Acceptance Criteria #7.
- Document findings and screenshots in PR.

---

## Testing Plan

- Automated: Add Jest/unit tests for auth guard utilities and a representative data fetch.
- Manual (Dev Environment):
  - Login as User A → create notes → log out.
  - Login as User B → verify User A’s notes are invisible; create separate notes.
  - Confirm API routes return 401/redirect when called without auth.
  - Regression test: ontology extraction endpoints should now require auth.
- Security Review: run through checklist in PR template; attach Supabase policy screenshots if needed.

---

## Dependencies & References

- `/docs/story-2.4.0-dev-environment.md` (must be completed first).
- `supabase/migrations` & `supabase/policies` directories.
- `src/contexts/AuthContext.tsx`, `src/lib/notes.ts`, `src/lib/supabase/*.ts`.
- `.claude/CLAUDE.md` deployment workflow.
- `docs/story-2.4.2-ontology-extraction.md` (downstream story).

---

## Risks & Mitigations

- **Breaking existing prototype flows:** Use dev environment QA to validate before promoting to main.
- **Forgotten unauthenticated routes:** Add Playwright smoke test covering main app navigation.
- **Supabase policy mistakes:** Test using Supabase SQL console with known user IDs before deploying.

---

## Definition of Done

- Feature branch `story-2.4.1-auth-integration` merged into `dev` with passing CI.
- Security review checklist completed with evidence.
- QA sign-off proves multi-user isolation.
- Ready to hand off to Story 2.4.2 (ontology extraction) for final feature delivery.
