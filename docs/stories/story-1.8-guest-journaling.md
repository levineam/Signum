# Story 1.8: Guest Journaling Before Sign-Up

**Story ID:** 1.8
**Epic:** Epic 1 - Clean Slate & Fresh Foundation
**Status:** Planned
**Priority:** High
**Estimated Effort:** 5-7 days
**Related Issue:** [#111](https://github.com/levineam/Signum/issues/111)

---

## User Story

As a potential user visiting Signum for the first time,
I want to immediately start using the full journal interface without signing up,
so that I can experience the product's core value before committing to creating an account.

---

## Problem Statement

Currently, the landing page shows a "Sign in to start journaling" message that creates friction before users can experience the product. This gate prevents potential users from discovering whether Signum provides value to them, reducing conversion rates and preventing users from experiencing the core journaling functionality that makes Signum unique.

**Current User Flow:**
1. Visit Signum landing page
2. See "Sign in to start journaling" message
3. Must create account before trying the product
4. High drop-off risk before experiencing value

**Desired User Flow:**
1. Visit Signum landing page
2. Immediately see full journal interface with helpers
3. Start typing and experiencing the product
4. After 2 seconds of inactivity, see gentle auth prompt
5. Sign up/in to persist content
6. Continue journaling seamlessly

---

## Business Value

- **Reduce Friction to First Value:** Let users experience journaling immediately
- **Increase Conversion:** Users more likely to sign up after experiencing value
- **Demonstrate Product:** Show helpers and rich text features before signup
- **Build Trust:** Let users "try before they buy" (commit to account)
- **Competitive Advantage:** Most journaling apps require signup first

---

## Acceptance Criteria

### Guest Journal Interface

1. ✅ Non-authenticated users see full journal interface on landing page
2. ✅ Journal interface identical to authenticated user experience, including:
   - Rich text editor with all formatting toolbar buttons
   - Helper tiles (Bad Thinking, Gratitude, Values, etc.)
   - Gentle prompts system
   - Auto-save indicator
3. ✅ Guest content stored locally in localStorage/sessionStorage
4. ✅ No network writes occur for guest users (client-side only)

### Idle Detection & Auth Modal

1. ✅ After user stops typing for 2 seconds, auth modal appears
2. ✅ Modal includes:
   - "Welcome Back" or "Start Your Journey" heading
   - Email input field
   - Password input field
   - "Sign In" button
   - "Forgot your password?" link
   - "Don't have an account? Sign up" link
3. ✅ Modal uses trailing debounce (cancels on new keystroke)
4. ✅ Modal can be dismissed with X button or Escape key
5. ✅ After dismissal, modal respects cooldown period (30-60s) before showing again

### Content Persistence

1. ✅ Guest content persists across page refreshes (until sign-up)
2. ✅ After sign-up/sign-in, guest content transfers to user account
3. ✅ Guest content saved as new journal entry with proper timestamp
4. ✅ Guest localStorage cleared after successful content transfer
5. ✅ If guest dismisses modal and leaves site, content remains in localStorage for future visit

### Hydration & SSR Compatibility

1. ✅ No hydration errors in console
2. ✅ Guest draft loads client-side only (not during SSR)
3. ✅ Default empty state on server-side render
4. ✅ Smooth transition from SSR to client-side draft loading

### Security & Data Model

1. ✅ HTML content sanitized using existing `sanitizeHtml.ts`
2. ✅ Guest drafts stored with compatible format (matches journal entry structure)
3. ✅ No security vulnerabilities from guest content injection
4. ✅ Rate limiting considerations for auth modal API calls

---

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Landing Page (Unauthenticated)          │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │   JournalStream (Guest Mode)           │    │
│  │   - Full rich text editor              │    │
│  │   - Helper tiles visible               │    │
│  │   - Prompts system active              │    │
│  │   - Auto-save to localStorage          │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │   useGuestDraft Hook                   │    │
│  │   - Load draft from localStorage       │    │
│  │   - Save on change (debounced)         │    │
│  │   - Clear after auth                   │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │   useIdleTimer Hook                    │    │
│  │   - 2s trailing debounce               │    │
│  │   - Cooldown after dismissal           │    │
│  │   - Show auth modal                    │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │   GuestAuthModal Component             │    │
│  │   - Sign in / Sign up forms            │    │
│  │   - Dismissible                        │    │
│  │   - Content transfer on success        │    │
│  └────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
1. User visits landing page (unauthenticated)
   ↓
2. useGuestDraft hook loads draft from localStorage
   ↓
3. JournalStream renders with guest content
   ↓
4. User types → auto-save to localStorage
   ↓
5. User stops typing → useIdleTimer starts 2s countdown
   ↓
6. After 2s idle → GuestAuthModal appears
   ↓
7a. User dismisses → cooldown timer (30s-60s)
7b. User signs in/up → content transfers to Supabase
   ↓
8. Guest localStorage cleared, user redirected to authenticated journal
```

### Key Files to Create

#### New Hooks

**`/src/hooks/useGuestDraft.ts`**
```typescript
import { useState, useEffect, useCallback } from 'react'

const GUEST_DRAFT_KEY = 'guest_journal_draft'

export const useGuestDraft = () => {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    // Client-side only - load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GUEST_DRAFT_KEY)
      if (saved) setDraft(saved)
    }
  }, [])

  const saveDraft = useCallback((content: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_DRAFT_KEY, content)
      setDraft(content)
    }
  }, [])

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_DRAFT_KEY)
      setDraft('')
    }
  }, [])

  return { draft, saveDraft, clearDraft }
}
```

**`/src/hooks/useIdleTimer.ts`**
```typescript
import { useRef, useCallback } from 'react'

export const useIdleTimer = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(callback, delay)
  }, [callback, delay])

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { reset, cancel }
}
```

#### New Components

**`/src/components/auth/GuestAuthModal.tsx`**
- Modal overlay with auth forms
- Email/password inputs
- Sign in / Sign up toggle
- Dismiss button (X)
- Escape key handler
- Content transfer on successful auth
- Uses shadcn Dialog component

**`/src/components/journal/GuestJournalView.tsx`** (optional wrapper)
- Wraps JournalStream for guest users
- Manages guest state
- Handles idle timer
- Shows auth modal when needed

#### Files to Modify

**`/src/app/page.tsx`** (Landing Page)
- Detect auth state
- Show GuestJournalView if unauthenticated
- Show normal JournalStream if authenticated

**`/src/components/journal/JournalStream.tsx`**
- Accept `isGuest` prop
- Load from useGuestDraft hook if guest
- Disable Supabase saves if guest
- Show guest mode indicator

**`/src/app/api/transfer-guest-content/route.ts`** (NEW API route)
- Accept guest content from localStorage
- Create new journal entry for authenticated user
- Return success/failure status

### Data Model

**Guest Draft Storage (localStorage):**
```typescript
interface GuestDraft {
  content: string        // HTML content from rich text editor
  lastModified: string   // ISO timestamp
  version: number        // Schema version for future migrations
}
```

**Storage Key:** `guest_journal_draft`

**Cooldown Storage (sessionStorage):**
```typescript
interface AuthModalState {
  dismissedAt: number    // Unix timestamp
  cooldownMs: number     // 30000 (30s) or 60000 (60s)
}
```

**Storage Key:** `auth_modal_dismissed`

---

## Open Questions & Product Decisions

### 1. Helper Restrictions for Guests

**Question:** Should helpers requiring server context be restricted for guests?

**Options:**
- **A) Full Access:** All helpers work for guests (recommended)
  - Pros: Best user experience, showcases full value
  - Cons: None (helpers are static prompts)
- **B) Restricted:** Hide AI-dependent helpers
  - Pros: Clearer distinction between guest/auth
  - Cons: Reduces perceived value

**Recommendation:** Option A - All helpers are static prompts, no server dependency

### 2. Debounce Timing

**Question:** Is 2 seconds the right delay for auth modal?

**Options:**
- **A) 2 seconds** (recommended based on GPT-5 analysis)
- **B) 3 seconds** (more conservative)
- **C) 5 seconds** (very conservative)

**Recommendation:** Start with 2s, A/B test if needed

### 3. Cooldown Duration

**Question:** How long should cooldown be after dismissal?

**Options:**
- **A) 30 seconds** (gentle reminder)
- **B) 60 seconds** (recommended)
- **C) Until page reload** (most conservative)

**Recommendation:** 60s (Option B) - balances persistence with non-annoyance

### 4. Guest Draft Storage Strategy

**Question:** Should we support multiple guest drafts?

**Options:**
- **A) Single global draft** (recommended for MVP)
  - Pros: Simple, clear mental model
  - Cons: Only one draft at a time
- **B) Per-day drafts**
  - Pros: Allows multiple draft sessions
  - Cons: More complex, unclear when to show which draft
- **C) Multiple drafts list**
  - Pros: Maximum flexibility
  - Cons: Complex UX for guests

**Recommendation:** Option A for MVP, consider B/C post-launch

### 5. Content Transfer Strategy

**Question:** How should guest content become a journal entry?

**Options:**
- **A) Auto-save as today's entry** (recommended)
  - Pros: Seamless, expected behavior
  - Cons: None
- **B) Prompt user where to save**
  - Pros: More control
  - Cons: Adds friction at critical conversion moment

**Recommendation:** Option A - create as today's entry with timestamp

---

## Testing Strategy

### E2E Tests (Playwright)

**Test File:** `/tests/e2e/guest-journaling.spec.ts`

**Test Cases:**

1. **Guest can type and use editor**
   - Visit landing page unauthenticated
   - Type in journal editor
   - Verify content persists
   - Refresh page, verify content reloads

2. **Helper tiles work for guests**
   - Click helper tile
   - Verify prompt inserts into editor
   - Test multiple helpers

3. **Toolbar formatting works**
   - Test bold, italic, underline
   - Test lists (bullet, numbered)
   - Test headings
   - Verify formatting persists after refresh

4. **Auth modal appears after 2s idle**
   - Type in editor
   - Stop typing
   - Wait 2 seconds
   - Verify modal appears
   - Modal shows sign-in and sign-up options

5. **Modal can be dismissed**
   - Show auth modal
   - Click X button (or press Escape)
   - Verify modal closes
   - Verify content still accessible

6. **Modal reappears after cooldown**
   - Dismiss modal
   - Wait 60 seconds
   - Type more content
   - Stop typing for 2s
   - Verify modal reappears

7. **Content transfer on sign-up**
   - Type guest content
   - Sign up with new account
   - Verify content saved as journal entry
   - Verify guest localStorage cleared
   - Verify redirected to authenticated journal

8. **Content transfer on sign-in**
   - Type guest content
   - Sign in with existing account
   - Verify content appended to today's entry (or new entry)
   - Verify guest localStorage cleared

9. **No network writes for guests**
   - Monitor network tab
   - Type as guest
   - Verify no POST/PUT requests to Supabase
   - Verify only localStorage used

10. **SSR hydration works correctly**
    - Check console for hydration errors
    - Verify smooth transition from SSR to client-side

### Manual Testing Checklist

- [ ] Guest sees full journal interface immediately
- [ ] All helper tiles visible and clickable
- [ ] Rich text toolbar fully functional
- [ ] Content persists across page refreshes
- [ ] Auth modal timing feels natural (not annoying)
- [ ] Modal dismiss works reliably
- [ ] Cooldown period feels appropriate
- [ ] Sign-up flow smooth with content transfer
- [ ] Sign-in flow smooth with content transfer
- [ ] No console errors or warnings
- [ ] Mobile experience functional
- [ ] Tablet experience functional
- [ ] Desktop experience optimal

---

## Security Considerations

### Content Sanitization

- ⚠️ **CRITICAL:** Use existing `src/utils/sanitizeHtml.ts` to sanitize guest content before saving to Supabase
- Prevent XSS attacks from malicious HTML in localStorage
- Validate content structure before transfer

### Rate Limiting

- Consider rate limiting auth modal API calls
- Prevent abuse of content transfer endpoint
- Use Vercel Edge Config or Supabase RLS for protection

### Data Privacy

- Guest content only in localStorage (client-side)
- No server-side storage until authentication
- Clear localStorage after successful transfer
- No analytics/tracking of guest content

### localStorage Limits

- Browser localStorage typically 5-10MB
- Monitor draft size, warn if approaching limits
- Consider sessionStorage for very long drafts

---

## Success Metrics

### Conversion Metrics

- **Guest-to-Signup Conversion Rate:** Target > 15% (vs current unknown baseline)
- **Time to First Value:** < 5 seconds (immediate journal access)
- **Auth Modal Dismiss Rate:** < 50% (if higher, increase cooldown or delay)
- **Content Transfer Success Rate:** > 95% (reliable data migration)

### Engagement Metrics

- **Guest Typing Duration:** Average time spent before auth prompt
- **Helper Tile Usage:** % of guests who click helpers
- **Formatting Feature Usage:** % of guests who use bold/italic/lists
- **Content Length at Signup:** Average character count of transferred content

### Technical Metrics

- **SSR Hydration Errors:** 0 errors in production
- **localStorage Failures:** < 1% (handle gracefully)
- **Content Transfer Failures:** < 5% (with proper error handling)
- **Page Load Performance:** < 2s to interactive journal

---

## Implementation Phases

### Phase 0: Foundation (Day 1)
- [ ] Create `useGuestDraft` hook
- [ ] Create `useIdleTimer` hook
- [ ] Add guest draft types to `/src/types/`
- [ ] Write unit tests for hooks

### Phase 1: Guest Journal UI (Days 2-3)
- [ ] Modify `JournalStream` to support guest mode
- [ ] Modify landing page to show guest journal
- [ ] Test guest typing and localStorage persistence
- [ ] Test helpers and formatting toolbar
- [ ] Test SSR hydration

### Phase 2: Auth Modal (Day 4)
- [ ] Create `GuestAuthModal` component
- [ ] Integrate with existing auth system
- [ ] Implement idle timer integration
- [ ] Implement dismiss and cooldown logic
- [ ] Test modal timing and UX

### Phase 3: Content Transfer (Day 5)
- [ ] Create `/api/transfer-guest-content` route
- [ ] Implement content sanitization
- [ ] Implement content transfer on sign-up
- [ ] Implement content transfer on sign-in
- [ ] Clear guest localStorage after transfer
- [ ] Test multi-user scenarios

### Phase 4: Testing & Polish (Days 6-7)
- [ ] Write E2E Playwright tests
- [ ] Manual testing across browsers
- [ ] Mobile/tablet testing
- [ ] Performance optimization
- [ ] Error handling polish
- [ ] Documentation updates

---

## Dependencies

**Prerequisites:**
- Story 1.3 (User Authentication) ✅ Complete
- Story 2.0 (Rich Text Toolbar) ✅ Complete
- Story 1.7 (Gentle Prompts) ✅ Complete

**Blockers:**
- None

---

## Future Enhancements (Post-MVP)

### Advanced Features (Story 1.3.1+)
- **Multiple Guest Drafts:** Support multiple draft sessions
- **Draft Auto-Expire:** Clear old drafts after 30 days
- **Draft Preview:** Show preview before transfer on signup
- **Draft Merge:** If user has existing entry for today, offer merge options
- **Social Proof:** Show "1,234 people started journaling today" counter
- **Guest Analytics:** Track guest engagement (privacy-respecting)

### UX Improvements
- **Progressive Disclosure:** Show more features as user types more
- **Contextual Tips:** "Did you know you can highlight text?" after 100 words
- **Gamification:** "You've written 50 words! Sign up to save your progress"
- **A/B Testing:** Test different modal timings and cooldowns

---

## Notes

- This story implements a "try before you buy" model that reduces friction to first value
- Critical to get timing right - too aggressive annoys users, too passive reduces conversions
- Content transfer must be bulletproof - losing guest content is unacceptable
- Consider this a conversion optimization feature, not just a technical enhancement
- GPT-5 analysis confirms this is a proven pattern for SaaS conversion optimization

---

## References

- [GitHub Issue #111](https://github.com/levineam/Signum/issues/111)
- GPT-5 Technical Analysis (in issue comments)
- `/docs/prd.md` - Product Requirements
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor
- `/src/components/journal/JournalStream.tsx` - Main journal UI
- `/src/utils/sanitizeHtml.ts` - HTML sanitization
