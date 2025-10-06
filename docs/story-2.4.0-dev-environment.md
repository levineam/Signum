# Story 2.4.0: Dev Environment Setup

**Status:** 🚧 PRIORITIZED - NEXT
**Updated:** 2025-10-06
**Prerequisites:** Story 2.3.6 (Unified Note Data Model) ✅ Complete

---

## Story

As a developer shipping new ontology features,
I want a persistent development environment that mirrors production (with real auth and data isolation),
so that I can test security-sensitive changes before they reach main and avoid regressions like the PROTOTYPE_USER_ID incident.

---

## Why This Matters

- The previous PR (#3) exposed a P0 privacy issue because we lacked a production-like staging surface.
- Security reviews now require demonstrating data isolation across users before production merges.
- Upcoming stories (2.4.1 auth integration and 2.4.2 ontology extraction) depend on a stable, authenticated environment for QA.
- CLAUDE.md and the PRD both document a three-tier workflow (PR preview → dev → main); this story operationalizes it.

---

## Scope

**In Scope**
- Create and protect a long-lived `dev` branch in GitHub.
- Configure a dedicated Vercel deployment target for the `dev` branch.
- Ensure dev environment uses the same Supabase project but test-only accounts.
- Document environment variables and workflow updates in CLAUDE.md / PR templates.
- Smoke test the deployment end-to-end using real Supabase auth.

**Out of Scope**
- Auth code refactors (handled by Story 2.4.1).
- Ontology extraction changes (handled by Story 2.4.2).
- Database migrations beyond configuring existing Supabase project.

---

## Deliverables

- Protected `dev` branch in GitHub with matching workflow automation.
- Vercel project / environment alias that auto-deploys the `dev` branch.
- Verified deployment at `https://dev.ontology-mu.vercel.app` (or final chosen dev hostname).
- Updated documentation describing the three-tier workflow and environment variable matrix.
- Sign-off checklist results recorded in PR description or dev notes.

---

## Acceptance Criteria

1. `dev` branch exists in GitHub, is set as a protected branch, and requires PR reviews.
2. Vercel automatically deploys pushes to `dev` to a persistent dev URL.
3. Dev environment uses the same Supabase project with dedicated test users (no PROTOTYPE_USER_ID usage).
4. Environment variable configuration differences between `dev` and `main` are documented (CLAUDE.md + `.env.example`).
5. Development workflow is updated: feature branches → PR to `dev` → verify on dev → PR from `dev` to `main`.
6. Authenticated smoke test succeeds on the dev URL using a test account.
7. PR template (or deployment checklist) includes a security review section referencing dev workflow.
8. All documentation references point to `docs/story-2.4.2-ontology-extraction.md` for the implementation guide after this split.

---

## Implementation Outline

### Phase 1 — Branch Infrastructure
- Create `dev` branch from latest `main`.
- Configure branch protection rules: required PR review, status checks, prevent direct pushes.
- Update project README / CLAUDE.md references to include branching diagram (if missing).

### Phase 2 — Vercel Configuration
- Create or repoint a Vercel project to track `dev` branch.
- Set environment variable group for dev (Supabase anon key, service role, NEXT_PUBLIC_SUPABASE_URL, OPENAI keys, etc.).
- Confirm Vercel preview deployments still trigger for feature branches targeting `dev`.

### Phase 3 — Supabase & Auth Readiness
- Create test users in Supabase (at least 2) for QA.
- Verify RLS policies remain intact for test users.
- Reset any seeded data that references PROTOTYPE_USER_ID.

**Test User Creation Steps (Manual):**
1. Visit dev deployment: https://signum-im11dbdvv-levineams-projects.vercel.app
2. Authenticate through Vercel SSO (owner access required)
3. Sign up for test accounts:
   - `dev-test-1@example.com`
   - `dev-test-2@example.com`
4. Verify each account can create journal entries
5. Verify data isolation (test-1 cannot see test-2's data)

### Phase 4 — Documentation & Workflow
- Update `.claude/CLAUDE.md` (already drafted) and ensure `.env.example` captures new env variables / instructions.
- Add development workflow notes to `docs/prd.md` (Epic 4 section) confirming dependency on this story.
- Add security checklist to PR template if not already landed.

### Phase 5 — Verification & Handoff
- Run smoke test: deploy sample change to `dev`, login, create notes, ensure data isolation.
- Capture screenshots or logs proving dev deployment works.
- Open PR `story-2.4.0-dev-environment` → `dev` with checklist / test results.
- After merge, prepare follow-up PR from `dev` → `main` once Story 2.4.1 completes.

---

## Testing & Verification

- ✅ Vercel dashboard shows successful deployment from latest `dev` commit.
- ✅ Visiting the dev URL prompts for Supabase auth; sign in with test account succeeds.
- ✅ Creating journal entries/notes on dev stores data under the signed-in user only.
- ✅ Feature-branch PR preview still works and remains isolated from dev.
- ✅ `git status` / branch protection denies direct pushes to `dev`.
- ✅ Security review checklist is visible in the PR template.

---

## Dependencies & References

- `/docs/prd.md` (Epic 4 changelog + story breakdown)
- `.claude/CLAUDE.md` (three-tier deployment workflow)
- `/supabase/` configuration and RLS policies
- `docs/story-2.4.2-ontology-extraction.md` (downstream implementation guide)
- `docs/story-2.4.1-auth-integration.md` (next story)

---

## Risks & Mitigations

- **Vercel quotas:** Ensure plan supports additional environment; mitigate by reusing existing project with branch-based environments.
- **Credential drift:** Centralize secrets using Vercel environment variable management; document updates in `.env.example`.
- **Process adoption:** Reinforce workflow in PR template and onboarding docs; add checkpoints during standups.

---

## Definition of Done

- Story document reviewed and approved by Product Manager.
- `story-2.4.0-dev-environment` branch merged into `dev` with passing checks.
- Dev environment link shared with team and validated by QA / Product.
- Ready to begin Story 2.4.1 work in the new dev workflow.
