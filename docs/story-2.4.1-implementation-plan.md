# Story 2.4.1 Implementation Plan: Auth Integration Hardening

**Last Updated:** 2025-10-06
**Owner:** Product Manager (John) — delegated to development team once approved

---

## 1. Current Status Snapshot

| Phase | Scope | Status | Notes |
|-------|-------|--------|-------|
| Phase 1 | Inventory & Cleanup | ✅ Complete | `PROTOTYPE_USER_ID` removed from `src/lib/notes.ts`; `.env` prototype vars to remove during cleanup checklist |
| Phase 2 | Authenticated Data Layer | 🟡 In Progress | `src/lib/notes.ts` updated, `NoteCreationModal.tsx` uses `useAuth()`. Remaining components listed below |
| Phase 3 | Route Protection & UX | ⏳ Not Started | Requires Next.js middleware or layout guard implementation |
| Phase 4 | Supabase Policy Verification | ⏳ Not Started | RLS audit + updates for notes/links tables |
| Phase 5 | API Routes & Services | ⏳ Not Started | Ensure all API routes use authenticated session |
| Phase 6 | Testing & QA Evidence | ⏳ Not Started | Unit tests + dev environment multi-user validation |

**Development Branch:** `story-2.4.1-auth-integration`

---

## 2. Objectives & Success Criteria

1. Remove all prototype user shortcuts and rely solely on authenticated Supabase sessions.
2. Enforce route-level protection so only authenticated users access journal, notes, ontology, and dashboard surfaces.
3. Ensure Supabase Row Level Security (RLS) policies require `auth.uid() = user_id` for every table touched by the ontology features.
4. Provide QA evidence from the dev environment showing isolation between at least two test accounts.
5. Document the new workflow (dev → main) and security checklist usage in PR description.

---

## 3. Detailed Work Breakdown

### Phase 2 — Complete Authenticated Data Layer (Remaining Work)

**Goal:** Every client/server access path carries the authenticated user ID; no shared IDs or anonymous fetches remain.

| Component / Module | Actions | Est. Effort |
|--------------------|---------|-------------|
| `src/components/journal/JournalStream.tsx` | Inject `useAuth()` (or server session) for userId; ensure note loads/saves call updated `notes` helpers; remove prototype fallbacks | 1.5h |
| `src/components/notes/OntologyAnalysisButton.tsx` | Require authenticated user context when triggering extraction API; ensure POST payload includes `userId`; guard for null session | 1h |
| `src/components/notes/NoteViewer.tsx` | Pass userId into data fetch; ensure delete/update actions use authenticated helpers | 1h |
| `src/app/notes/[id]/page.tsx` | Update server-side loader to read Supabase session; redirect unauthenticated users; thread userId to components | 1h |
| `src/app/notes/page.tsx` | Fetch notes via authenticated helper; ensure Suspense/loaders handle missing session gracefully | 1h |
| Shared utilities (`src/lib/supabase/notes.ts`, `src/lib/ontology/*`) | Review for lingering prototype helpers; adjust signatures to accept userId | 1h |
| API routes (preview) | Inventory endpoints touched by notes/ontology (`/api/extract-ontology`, `/api/notes`, etc.) and prepare for Phase 5 | 0.5h |

**Exit Criteria:** `rg "PROTOTYPE" src` returns no matches; TypeScript signatures ensure `userId` is required wherever note data moves.

### Phase 3 — Route Protection & UX

1. **Decide on approach:**
   - Option A: Next.js middleware (`middleware.ts`) to gate `/notes`, `/ontology`, `/dashboard`, `/settings`.
   - Option B: Layout/component guard using `redirect()` and session checks.
2. **Implementation Steps:**
   - Create shared `requireAuth()` server helper using Supabase server client.
   - Add loading skeleton for client transitions while session resolves.
   - Update `AuthContext` to expose explicit `status: 'loading' | 'authenticated' | 'unauthenticated'`.
3. **Deliverables:**
   - Middleware or layout guard committed.
   - UX states for loading + unauthorized (e.g., redirect with toast or message).

**Exit Criteria:** Navigating to protected routes while logged out redirects to `/auth` with no data leak.

### Phase 4 — Supabase Policy Verification & Updates

1. **Inventory tables:** `notes`, `links`, any auxiliary tables touched by ontology flow.
2. **Policy checklist:**
   - Ensure `auth.uid() = user_id` on `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
   - Remove or tighten any `USING TRUE` fallback policies from prototype.
   - Add tests/SQL checks (use Supabase SQL console or automated script) verifying blocked access across users.
3. **Documentation:** Record policy snippets in story doc and PR description.

**Exit Criteria:** Attempting cross-user access in SQL console fails; policy file diffs included in PR.

### Phase 5 — API Routes & Services

1. Convert each API route to server-side Supabase client using `createRouteHandlerClient` (or equivalent helper).
2. Validate session inside handler; return 401 if absent.
3. Ensure request payloads never accept `userId` from client (derive from session).
4. Update client callers (e.g., `OntologyAnalysisButton`) to omit `userId` if route uses session directly.
5. Re-run local tests to confirm no unauthorized access.

**Targets:**
- `/src/app/api/extract-ontology/route.ts`
- `/src/app/api/notes/*`
- Any server actions or tRPC endpoints (if applicable)

**Exit Criteria:** All route handlers fetch `session.user.id` server-side; unauthorized calls return 401.

### Phase 6 — Testing & QA Evidence

1. **Automated Tests:**
   - Unit: Auth guard utilities, updated note helpers, policy enforcement mocks.
   - Integration: Ensure protected pages redirect unauthenticated requests.
2. **Manual Dev-Environment Validation:**
   - Using `dev` environment (Story 2.4.0), create User A and User B.
   - Confirm cross-account isolation (notes, ontology cards, API calls).
   - Capture screenshots/logs for PR evidence.
3. **Security Checklist:** Complete new PR template section, attach Supabase policy proof, mention manual test steps.

**Exit Criteria:** QA evidence linked in PR; `npm run lint` and targeted tests pass; dev environment sign-off captured.

---

## 4. Timeline & Sequencing

| Weekday | Focus | Owner | Notes |
|---------|-------|-------|-------|
| Day 1 | Finish Phase 2 component updates + shared utilities | Dev | Prioritize components with highest foot traffic (`JournalStream`, `NotesPage`) |
| Day 2 | Implement route protection (Phase 3) and start RLS audit (Phase 4) | Dev w/ PM review | Coordinate with Supabase admin for policy changes |
| Day 3 | Complete RLS updates, convert API routes | Dev | Deploy to dev environment for smoke test |
| Day 4 | Testing & QA evidence; fix regressions | Dev + QA | Capture screenshots, update documentation |
| Day 5 | Final review, prepare PR for `dev` branch | Dev/PM | Include security checklist, test results |

*Adjust timing based on actual effort; above assumes ~20-24 hours of engineering work.*

---

## 5. Dependencies & Prerequisites

- Story 2.4.0 dev environment must be operational (branch protection, Vercel dev URL, test accounts).
- Supabase credentials accessible to dev team; service role not exposed client-side.
- Updated documentation from Story 2.4.0/CLAUDE.md available for reference.
- Coordination with QA for multi-user testing schedule.

---

## 6. Risk Register & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hidden prototype references remain | High | Run `rg "prototype"`, `rg "00000000-0000"`, code review checklist |
| Middleware causes redirect loop | Medium | Add integration test, ensure public paths bypass guard |
| RLS changes break existing seed scripts | Medium | Update `/scripts/seed-ontology-notes.js` to authenticate per user |
| API route auth refactor introduces latency | Low | Cache Supabase client per request, monitor logs |
| Timeline slip due to component complexity | Medium | Parallelize work where possible; daily standups to unblock |

---

## 7. Communication & Reporting

- **Daily Update:** Post progress in project channel referencing this plan.
- **Blocking Issues:** Escalate to PM immediately; adjust timeline as needed.
- **Code Review:** Request security-focused review before merging into `dev`.
- **Documentation:** Update `docs/story-2.4.1-auth-integration.md` changelog after each phase completes.

---

## 8. Definition of Done (Expanded)

1. All phases complete with code merged into `dev` branch.
2. Dev deployment verified with multi-user isolation.
3. Security checklist completed in PR description, with evidence links.
4. Story artifacts updated (story doc, sprint proposal status, PRD cross-references).
5. Hand-off note queued for Story 2.4.2, confirming prerequisites met.

---

**Next Action:** Review this plan with development lead. Upon approval, resume implementation starting at Phase 2 remaining tasks.
