# Story 2.4.4: Incremental AI Ontology Analysis

**Status:** 🚧 PRIORITIZED - NEXT
**Updated:** 2025-10-10
**Prerequisites:**
- Story 2.4.0 (Dev Environment Setup) — finish outstanding work noted as 🚧 PRIORITIZED - NEXT before starting this story.
- Story 2.4.1 (Auth Integration Hardening) — merge/verify data isolation (story doc also marked 🚧 PRIORITIZED - NEXT).
- Story 2.4.2 (Links Persist to Supabase) — confirmed complete via PRD changelog (ensures link metadata in Supabase).
- Story 2.4.3 (Manual Ontology Extraction MVP) — baseline extraction path and API route verified.

---

## Story

As a reflective journaler,
I want new ontology insights to appear automatically soon after I write fresh journal entries,
so that I can track how my values, beliefs, and aims evolve without repeatedly triggering manual analysis.

---

## Why This Matters

- Manual "Analyze My Notes" button in Story 2.4.3 is high friction; early testers forget to re-run it and assume the ontology is stale.
- Current flow re-sends all historical notes to GPT-5-mini, making costs scale linearly with total note volume.
- Incremental analysis lets us process only the delta (new or edited journal entries), reducing token usage by ~80% (per `docs/ontology-analysis-process.md`).
- Automation unlocks downstream analytics (Story 2.4.5) that depend on timely ontology refreshes.

---

## Scope

**In Scope**
- Automatically detect new or materially edited journal entries since the last successful analysis.
- Queue incremental ontology extraction without requiring a user button click.
- Merge newly extracted ontology items with existing ones (dedupe, enrich metadata, preserve provenance).
- Notify users that new insights were added (non-blocking toast or in-app notification).
- Instrument metrics: last analysis timestamp, number of notes processed, extraction duration, token cost estimate.

**Out of Scope**
- Suggestion review/approval workflow (Story 2.4.5+).
- Analytics dashboards or historical trend charts (Story 2.4.5).
- Rebuild of existing ontology UI cards beyond refresh hooks.
- Background job infrastructure beyond what Next.js / Supabase Edge Functions already support.

---

## Deliverables

- Supabase Edge Function trigger (primary) that launches incremental extraction when thresholds are met, with a documented Next.js scheduled fallback.
- Server-controlled feature flag (`ONTOLOGY_INCREMENTAL_ENABLED`) with a read-only client indicator to enable/disable automation quickly.
- Persistent tracking of `lastAnalyzedAt`, per-user note digests, and hash comparisons stored in Supabase (`ontology_analysis_state` table or metadata column).
- Documented reliance on Supabase `notes.updated_at` (plus supporting index) as the canonical change detector.
- Updated extraction pipeline that accepts a subset of notes and merges results with existing ontology items.
- User-facing indicator confirming automatic updates (e.g., toast: "Ontology refreshed with insights from 3 new entries").
- Observability hooks (console logs, Supabase metrics, or lightweight logging table) documenting each run.
- Updated documentation describing new automation behavior, configuration flags, and rollback procedure.

---

## Acceptance Criteria

### Detection & Scheduling
1. System tracks each user's `lastAnalyzedAt` timestamp (default null for new users).
2. When a user creates or updates a journal-entry/reflection/custom note, we rely on Supabase `notes.updated_at` (surfaced as `updatedAt` in the generated types) and compare it against `lastAnalyzedAt`.
3. Incremental analysis triggers when either of these conditions is true:
   - ≥ 5 new or updated notes since the last analysis, or
   - ≥ 24 hours have passed with ≥ 1 new note recorded.
4. Trigger executes without user action (either server-side on note insert/update hook or via scheduled job polling Supabase).
5. Trigger throttled so that only one run per user executes concurrently (protects GPT usage).

### Extraction Input Preparation
1. Only notes with `noteType IN ('journal-entry', 'reflection', 'custom')` and `updated_at > lastAnalyzedAt` are sent to GPT.
2. For edited notes, send the updated content plus a summary of prior ontology links referencing that note (context for conflict resolution).
3. Prompt includes a condensed summary of existing ontology items to avoid duplicates.
4. Batch size capped at 10 notes per incremental run; additional notes queue for the next run.

### AI Processing & Merge
1. GPT-5-mini remains the default model with `reasoning.effort: 'medium'`.
2. Response schema matches Story 2.4.3 (concept, category, confidence, supporting excerpts, reasoning).
3. High-confidence (`confidence === 'high'`) items auto-merge; medium confidence items attach `reviewRequired: true` metadata for future workflows.
4. Duplicate detection uses normalized title matching + embedding similarity (via existing Supabase vector store if available; otherwise fall back to string comparison).
5. When duplicates exist, metadata merges source note references and updates confidence only if new evidence is stronger.
6. `lastAnalyzedAt` updates to the run completion timestamp only when extraction succeeds; failures leave timestamp untouched and log error details.

### User Experience
1. Manual "Analyze My Notes" button remains for emergency re-runs but displays last automatic run info (`"Last updated 15 min ago"`).
2. On successful background run, user sees non-blocking toast or notification badge on the Notes page.
3. UI refreshes ontology cards automatically (websocket or polling) within 10 seconds of run completion.
4. If incremental run fails, surface alert banner with retry instructions and log error for support triage.

### Observability & Safety
1. Instrument structured logs: userId, noteCount, runtime, tokenEstimate, status.
2. Add rate limiting guard so any single user cannot trigger more than 6 runs/hour.
3. Server-side feature flag (`ONTOLOGY_INCREMENTAL_ENABLED`) controls background execution; client surfaces read-only status via API/endpoints.
4. Document recovery steps: how to reset `lastAnalyzedAt`, replay missed notes, or disable automation.

---

## Implementation Outline

### Phase 1 — State Tracking
- Create Supabase migration for `ontology_analysis_state` table with columns: `user_id`, `last_analyzed_at`, `pending_note_ids`, `last_run_summary`.
- Ensure `notes.updated_at` has an index and is surfaced through data helpers as the canonical "last modified" field (no new column introduced).
- Update note insert/update flows to write audit entries (`note_activity` table or metadata) capturing `noteId`, `userId`, `timestamp`, `action`.
- Expose helper in `src/lib/ontology/state.ts` to read/write analysis state.

### Phase 2 — Trigger Mechanism
- Adopt Supabase database trigger → Edge Function (Option A) as the default execution path when `note_activity` inserts.
- Document a Next.js scheduled route (cron) fallback in the runbook for manual recovery or replay scenarios.
- Implement concurrency lock (e.g., `analysis_locks` table with TTL) to avoid overlapping runs.

### Phase 3 — Incremental Extraction Service
- Extend `src/lib/ontology/extractor.ts` with `runIncrementalExtraction(userId)` that:
  1. Fetches eligible notes.
  2. Builds incremental prompt (reuse `src/utils/ontologyPrompts.ts` with delta-specific template).
  3. Calls OpenAI Responses API.
  4. Parses output via existing schema validators.
  5. Invokes merge routine.
- Update deduplication logic to consider existing ontology notes + new candidates simultaneously.

### Phase 4 — Merge & Persistence
- Create `src/lib/ontology/merge.ts` handling:
  - Duplicate detection (title normalization, optional embeddings).
  - Confidence reconciliation (upgrade/downgrade rules).
  - Metadata aggregation (append new source note references, timestamps).
- Ensure Supabase writes are batched in a transaction for consistency.
- Update ontology cards query to include `lastUpdatedAt` metadata for UI display.

### Phase 5 — UX Enhancements
- Update `OntologyAnalysisButton` to show last run info and fallback manual trigger.
- Add `OntologyUpdateToast` component listening for Supabase realtime events on `ontology_analysis_state`.
- Introduce settings toggle (if product agrees) to pause auto-analysis per user; default ON.

### Phase 6 — Observability & Ops Docs
- Add structured logging via `src/lib/observability/logger.ts` (reuse existing log pattern if available).
- Document feature flag controls in `docs/runbooks/ontology-incremental.md` (new file).
- Update `/docs/ontology-analysis-process.md` and `/docs/prd.md` with new flow diagrams.

---

## Testing & Verification

- Unit tests covering:
  - Threshold calculator (`shouldTriggerIncrementalRun` logic).
  - Merge/deduplication behavior.
  - State persistence helpers.
- Integration tests (mock OpenAI) verifying end-to-end incremental run processes only delta notes and merges correctly.
- Manual QA checklist:
  1. Create 5 new journal entries quickly → verify auto-run triggers and cards update.
  2. Edit an existing journal entry to add new content → confirm incremental run re-evaluates that note.
  3. Pause server flag (`ONTOLOGY_INCREMENTAL_ENABLED`) → ensure no background runs occur; manual button still works.
  4. Induce OpenAI failure (invalid key) → confirm error surfaces and state not advanced.
- Capture cost comparison chart (manual vs incremental) for PM review.

---

## Risks & Mitigations

- **Over-triggering leading to cost spikes:** Mitigate with thresholds, rate limits, and feature flag.
- **Duplicate ontology clutter:** Strengthen merge heuristics and monitor via logging dashboard.
- **Background job failures hidden from users:** Expose status banner + create support alert channel (e.g., Slack webhook) if repeated failures occur.
- **Concurrency race conditions:** Enforce transactional locks around state updates.

---

## Definition of Done

- Story document reviewed/approved by PM and Tech Lead.
- Incremental analysis feature flag default ON in `dev` with QA sign-off; OFF by default in `main` until release decision.
- Documentation updated (`docs/ontology-analysis-process.md`, `docs/prd.md`, new runbook).
- Demo scenario recorded showing automatic ontology refresh after creating new entries.
- Follow-up tickets filed for analytics dashboard (Story 2.4.5) and suggestion review enhancements.

---

## References

- `docs/prd.md` (Epic 4 changelog + backlog)
- `docs/ontology-analysis-process.md` (Incremental analysis plan)
- `docs/stories/completed/story-2.4.3-ontology-extraction.md`
- `src/app/api/extract-ontology/route.ts`
- `src/components/notes/OntologyAnalysisButton.tsx`
- Supabase project dashboard: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
