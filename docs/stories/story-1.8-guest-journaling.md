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

## Tasks / Subtasks

### Task 1: Phase 0 - Foundation (Hooks & Types)
- [x] Create `/src/types/guest.ts` with GuestDraft, AuthModalState interfaces
- [x] Create `/src/hooks/useGuestDraft.ts`
  - [x] Client-side localStorage loading with useEffect guard
  - [x] saveDraft with size limit and QuotaExceededError handling
  - [x] clearDraft function
  - [x] getDraftSize utility
- [x] Create `/src/hooks/useIdleTimer.ts`
  - [x] Trailing debounce with reset/cancel
  - [x] Cooldown checking via sessionStorage
  - [x] setDismissed for cooldown tracking
  - [x] Cleanup in useEffect

### Task 2: Phase 1 - Auth Modal Component
- [x] Create `/src/components/auth/GuestAuthModal.tsx`
  - [x] Use shadcn Dialog as base
  - [x] Email + password inputs with validation
  - [x] Sign in button (primary action)
  - [x] Forgot password link
  - [x] Sign up link toggle
  - [x] X close button
  - [x] ESC key handler (via Dialog's onOpenChange)
- [x] Implement accessibility
  - [x] Focus trap (built-in via Radix Dialog)
  - [x] ARIA labels (role="dialog", aria-labelledby, aria-describedby)
  - [x] Keyboard navigation (Tab/Shift+Tab - native)
  - [x] Focus management (autoFocus on email input)
- [x] Add auto-dismiss after 30s inactivity
- [ ] Test modal in isolation

### Task 3: Phase 2 - Guest Journal Integration
- [x] Examine current landing page
  - [x] Read `/src/app/page.tsx` to understand auth detection
  - [x] Identify where "Sign in to start journaling" message is rendered
- [x] Modify landing page for guest mode
  - [x] Detect auth state (use existing auth context/hook)
  - [x] Render JournalStream for unauthenticated users
  - [x] Pass isGuest prop or similar signal
- [x] Modify `/src/components/journal/JournalStream.tsx`
  - [x] Accept isGuest boolean prop
  - [x] Integrate useGuestDraft when isGuest=true
  - [x] Integrate useIdleTimer
  - [x] Wire editor onChange to saveDraft + timer reset
  - [x] Show GuestAuthModal when idle timer fires
  - [x] Disable Supabase auto-save when isGuest=true
- [ ] Test guest typing and localStorage persistence
- [ ] Verify SSR hydration (no console errors)
- [ ] Verify helpers work for guests
- [ ] Verify formatting toolbar works for guests

### Task 4: Phase 3 - Content Transfer API
- [x] Create `/src/app/api/transfer-guest-content/route.ts`
  - [x] Accept POST with { content: string }
  - [x] Verify authentication via Supabase session
  - [x] Import sanitizeHtml from utils
  - [x] Sanitize guest HTML content
  - [x] Create journal entry (note_type='journal-entry')
  - [x] Set proper timestamps
  - [x] Return success { entryId } or error
- [x] Implement transfer in JournalStream handleAuthSuccess
  - [x] On successful auth, get draft from useGuestDraft
  - [x] Wait for session token to be available
  - [x] Call /api/transfer-guest-content with auth header
  - [x] On success: clearDraft, show toast, close modal
  - [x] On error: show error, keep draft, keep modal open
- [ ] Handle offline mode
  - [ ] Detect offline before transfer
  - [ ] Show offline warning
  - [ ] Queue transfer for when online (listen to 'online' event)
- [ ] Handle errors
  - [ ] Transfer failure: exponential backoff retry
  - [ ] Network timeout: 10s with retry
  - [ ] Auth failures: user-friendly messages
- [ ] Test sign-up flow with content transfer
- [ ] Test sign-in flow with content transfer

### Task 5: Phase 4 - E2E Tests & Polish
- [ ] Create `/tests/e2e/guest-journaling.spec.ts`
  - [ ] Test: Guest can type and use editor
  - [ ] Test: Helper tiles work
  - [ ] Test: Toolbar formatting works
  - [ ] Test: Auth modal appears after 2s (use Playwright clock)
  - [ ] Test: Modal dismissible (X and ESC)
  - [ ] Test: Modal reappears after cooldown
  - [ ] Test: Content transfer on sign-up
  - [ ] Test: Content transfer on sign-in
  - [ ] Test: No network writes pre-auth
  - [ ] Test: SSR hydration correct
  - [ ] Test: Offline handling
  - [ ] Test: Focus trap accessibility
  - [ ] Test: Keyboard navigation
- [ ] Create test utilities in `/tests/helpers/guest-journaling.ts`
- [ ] Run all E2E tests, fix failures
- [ ] Manual testing
  - [ ] Chrome, Firefox, Safari
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Tablet
  - [ ] No console errors
- [ ] Run `npm run lint` and fix issues
- [ ] Run `npm run build` and verify success

---

## Definition of Done

- [ ] All acceptance criteria pass locally
- [ ] `npm run lint` passes with no errors
- [ ] Playwright E2E tests for guest journaling are green
- [ ] Security checks: no pre-auth writes; sanitization confirmed
- [ ] Documentation updated (this story + any README notes if needed)
- [ ] Optional: feature flag toggle plan documented for staged rollout

---

## Dev Agent Record

### Agent Model Used
- Model: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Started: October 31, 2025 1:20 PM
- Completed: [In Progress]

### Debug Log References
- [None yet]

### Completion Notes
**Phase 0 Complete:**
- Created guest types with interfaces and constants
- Implemented useGuestDraft with QuotaExceededError handling and sessionStorage fallback
- Implemented useIdleTimer with cooldown checking via sessionStorage
- All hooks include proper TypeScript typing and error handling

**Phase 1 Complete:**
- Created GuestAuthModal component with full accessibility
- Implemented sign-in/sign-up/reset password flows
- Added auto-dismiss after 30s inactivity with interaction reset
- Modal prevents close during auth operations
- Uses shadcn Dialog with built-in focus trap and ARIA labels
- Includes onAuthSuccess callback for content transfer integration

**Phase 2 Complete:**
- Modified `/src/app/page.tsx` to pass isGuest prop to JournalStream
- Added guest mode detection: `isGuest = !user && !authLoading`
- Integrated guest hooks into JournalStream component:
  - Created guest entry with local draft content
  - Wired editor onChange to saveGuestDraft and resetIdleTimer
  - Disabled Supabase saves for guests
  - Added GuestAuthModal rendering with open/close handlers
- Guest entry auto-enters edit mode on mount
- Idle timer triggers auth modal after 2s of no typing
- Modal dismissal tracked with 60s cooldown via sessionStorage

**Phase 3 Complete:**
- Created `/src/app/api/transfer-guest-content/route.ts` API endpoint
- Verifies authentication via Bearer token from request headers
- Sanitizes HTML content using existing sanitizeHtml utility
- Creates or updates today's journal entry for authenticated user
- Handles existing entry detection via journalDate metadata
- Implemented handleAuthSuccess in JournalStream:
  - Waits up to 5s for session token to be available after auth
  - Calls transfer API with Authorization header
  - Clears local draft on success
  - Shows success toast and closes modal
  - Keeps draft and modal open on failure for retry

### File List

**New Files Created:**
- `/src/types/guest.ts` (769 bytes)
- `/src/hooks/useGuestDraft.ts` (2,826 bytes)
- `/src/hooks/useIdleTimer.ts` (1,980 bytes)
- `/src/components/auth/GuestAuthModal.tsx` (8,560 bytes)
- `/src/app/api/transfer-guest-content/route.ts` (5,234 bytes)

**Modified Files:**
- `/src/app/page.tsx` - Added isGuest prop passing to JournalStream
- `/src/components/journal/JournalStream.tsx` - Guest mode integration (110 lines added)

**Deleted Files:**
- [None]

### Change Log
- **2025-10-31 1:20 PM**: Created Phase 0 foundation files (types + hooks)
- **2025-10-31 1:35 PM**: Created GuestAuthModal component with accessibility features
- **2025-10-31 [Time]**: Integrated guest mode into landing page and JournalStream
- **2025-10-31 [Time]**: Created transfer API endpoint with auth and sanitization
- **2025-10-31 [Time]**: Fixed TypeScript errors (useRef initialization, auth data typing)
- **2025-10-31 [Time]**: Fixed build error (moved Supabase client into function scope)

---

## References

- Issue #111 discussion and technical notes
- Existing editor and journal components:
  - `src/components/journal/JournalStream.tsx`
  - `src/components/editor/SimpleRichEditor.tsx`
- Sanitization util: `src/utils/sanitizeHtml.ts` (or equivalent)

