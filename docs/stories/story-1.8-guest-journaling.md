# Story 1.8: Guest Journaling (Start Without Sign-In) - Brownfield Enhancement

**Story ID**: 1.8  
**Epic**: Epic 1 – Clean Slate & Fresh Foundation  
**Related Issue**: [#111 – Allow guest users to start journaling before sign-up/sign-in](https://github.com/levineam/Signum/issues/111)  
**Status**: Ready for Implementation  
**Estimated Effort**: 2–4 days  
**Priority**: High (onboarding conversion)  
**Created**: October 31, 2025  
**Last Updated**: October 31, 2025

---

## User Story

As a new visitor,
I want to start journaling immediately without creating an account,
So that I can experience the product’s value before committing to sign up.

---

## Problem & Goal

Current landing flow blocks usage behind authentication, hiding the editor and helpers. This increases friction and delays time-to-value. The goal is to render the full journal interface to guests and only prompt for authentication after they have engaged with the editor, preserving anything they wrote across the auth boundary.

---

## Scope

- Render the full journal interface (editor + helpers) to unauthenticated users.  
- After the user stops typing for 2 seconds, show a sign-in/sign-up modal.  
- Persist guest content locally; on auth, transfer to a real journal entry and clear the local draft.  
- Modal can be dismissed; it reappears after continued typing with a cooldown.

Out of scope: Social sign-in providers setup, advanced A/B testing, multi-draft management.

---

## Acceptance Criteria

Functional
- [ ] Guest users see the full journal UI on the landing page (`JournalStream` + helpers).  
- [ ] `SimpleRichEditor` is fully interactive for guests (typing + formatting toolbar).  
- [ ] Helper tiles (e.g., Bad Thinking/Gratitude/Values) are visible and can insert content.  
- [ ] An auth modal appears 2 seconds after the guest stops typing (trailing debounce).  
- [ ] Modal supports sign-in and sign-up; includes forgot password and link to sign up.  
- [ ] Guest content persists locally and is transferred on successful authentication.  
- [ ] Dismissing the modal re-prompts after continued typing, respecting cooldown.  
- [ ] No network writes occur before authentication.

Non-Functional
- [ ] Accessibility: focus trap in modal; keyboard-only navigation; ESC closes; ARIA labels and announcements.  
- [ ] Hydration-safe: no SSR access to `localStorage`; no hydration warnings.  
- [ ] Resilient: handles offline mode, transfer failures, localStorage quota errors.  
- [ ] Analytics: events for typing start, modal shown/dismissed, auth success, transfer success/fail.  
- [ ] Performance: idle detection and modal logic do not degrade typing responsiveness.

---

## Decisions (Confirmed)

- Idle timer: 2000 ms (2 seconds) trailing debounce after last keystroke.  
- Re-prompt cooldown: 60000 ms (60 seconds) after dismissal.  
- Auto-dismiss modal: 30000 ms (30 seconds) of inactivity in modal.  
- Draft storage key: single global key `guest_journal_draft`.  
- Draft format: HTML content (matches existing journal entry structure).  
- Security: never send guest content to the server before authentication; sanitize on transfer.

---

## Technical Design

Components & Hooks
- `src/hooks/useGuestDraft.ts`  
  - Loads/saves/clears a single global guest draft using `localStorage`.  
  - Client-side only access; loaded in `useEffect` to avoid SSR mismatches.  
  - Shape stored under key `guest_journal_draft`:
  
  ```ts
  interface GuestDraft {
    version: number;        // schema version, start at 1
    content: string;        // HTML string, sanitized on transfer
    lastModified: string;   // ISO timestamp
  }
  ```

- `src/hooks/useIdleTimer.ts`  
  - Simple trailing debounce hook.  
  - `reset()` on content change; fires after 2000 ms of idle.  
  - `cancel()` clears timeout.  

- `src/components/auth/GuestAuthModal.tsx`  
  - Dismissible sign-in/sign-up modal; ESC to close; focus trapped.  
  - Auto-dismiss after 30s of inactivity (timer resets on interaction).  
  - Uses shadcn/ui Dialog components for consistency.  

Integration & Flow
- `src/app/page.tsx` (or `src/app/journal/page.tsx` based on routing) renders `JournalStream` for guests.  
- `src/components/journal/JournalStream.tsx` wires the editor’s `onChange` to both local draft persistence and the idle timer.  
- On idle (2 seconds), show `GuestAuthModal` unless within cooldown window.  
- On successful auth, call `/api/transfer-guest-content` to create a real entry and then clear `guest_journal_draft`.

Server/API
- `src/app/api/transfer-guest-content/route.ts`  
  - Authenticated endpoint: reads guest draft from request body, sanitizes HTML via existing `sanitizeHtml.ts`, creates a new journal entry for the user, returns created entry metadata, and instructs client to clear local draft.  
  - Rate-limit by session/IP if needed (follow existing patterns).  

Data & Sanitization
- Store HTML locally; do not trust it on the server.  
- On transfer, sanitize HTML and validate size limits.  
- Consider truncation or warning if content exceeds max size.

Error Handling
- SSR: default to empty draft; hydrate with client-loaded draft in `useEffect`.  
- Offline: keep draft locally; show banner; retry transfer when online.  
- Quota exceeded: show non-blocking error; allow user to continue typing; suggest sign-in.  
- Transfer failure: keep local draft; show retry with backoff; do not clear draft on failure.  
- Modal dismissal cooldown: persisted in-memory for MVP; optionally persist to `sessionStorage`.

Analytics (MVP)
- `guest_typing_started`, `guest_modal_shown`, `guest_modal_dismissed`, `guest_auth_success`, `guest_transfer_success`, `guest_transfer_failed`.  
- Include timestamps and content length (not content).

Security
- No pre-auth network writes.  
- Sanitize HTML on server before save.  
- Do not log raw content in analytics or server logs.  
- Clear local draft only after confirmed transfer.

---

## Files & Changes

New
- `src/hooks/useGuestDraft.ts`  
- `src/hooks/useIdleTimer.ts`  
- `src/components/auth/GuestAuthModal.tsx`  
- `src/app/api/transfer-guest-content/route.ts`

Modified
- `src/app/page.tsx` (or `src/app/journal/page.tsx`) – render journal for guests and mount modal  
- `src/components/journal/JournalStream.tsx` – wire guest draft + idle timer  
- `src/components/editor/SimpleRichEditor.tsx` – ensure `value`/`onChange` contract is solid for guest mode

---

## Test Plan (Playwright)

Core Scenarios
- [ ] Guest can type in editor and use formatting toolbar.  
- [ ] Helper tiles insert content for guests.  
- [ ] Auth modal appears exactly 2s after last keystroke (use fake timers/clock).  
- [ ] Modal can be dismissed with button and ESC; focus returns to editor.  
- [ ] Modal reappears after continued typing, respecting a 60s cooldown.  
- [ ] After sign-in/sign-up, guest content is persisted as a real entry; local draft cleared.  
- [ ] No network writes occur pre-auth (assert no POSTs before auth).  
- [ ] SSR hydration produces no console errors.  
- [ ] Offline mode retains draft; transfer succeeds once back online.

Artifacts
- `tests/e2e/guest-journaling.test.ts` (new)  
- Optional: screenshot expectations under `test-results/`.

---

## Risks & Mitigations

- Hydration mismatch: only touch `localStorage` in client effects; initialize editor with server-safe defaults.  
- Timing flakiness: centralize idle logic in hook; use fake timers in tests.  
- Nagging UX: 60s cooldown; consider session-level persistence if feedback indicates annoyance.  
- Data loss on transfer: clear local draft only after confirmed save; provide retry flow.

---

## Phases

Phase 0 – Hooks  
- Implement `useGuestDraft` and `useIdleTimer`; add unit smoke checks if applicable.

Phase 1 – Modal  
- Build `GuestAuthModal` with shadcn/ui Dialog; a11y complete; ESC to close.

Phase 2 – Integration  
- Render guest mode in `page.tsx`; wire editor changes to draft + idle timer; mount modal with cooldown logic.

Phase 3 – Transfer API  
- Implement `/api/transfer-guest-content`; sanitize and persist; clear local draft on success.

Phase 4 – E2E  
- Add Playwright coverage for idle timing, dismissal/cooldown, persistence across auth, and offline handling.

---

## Definition of Done

- [ ] All acceptance criteria pass locally.  
- [ ] `npm run lint` passes with no errors.  
- [ ] Playwright E2E tests for guest journaling are green.  
- [ ] Security checks: no pre-auth writes; sanitization confirmed.  
- [ ] Documentation updated (this story + any README notes if needed).  
- [ ] Optional: feature flag toggle plan documented for staged rollout.

---

## References

- Issue #111 discussion and technical notes  
- Existing editor and journal components:  
  - `src/components/journal/JournalStream.tsx`  
  - `src/components/editor/SimpleRichEditor.tsx`  
- Sanitization util: `src/utils/sanitizeHtml.ts` (or equivalent)

