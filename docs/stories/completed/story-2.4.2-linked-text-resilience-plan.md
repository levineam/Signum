# Linked-Text Resilience Plan (Story 2.4.3 - DRAFT)

**Status**: Draft for Review
**Author**: User
**Date**: 2025-10-08

## Context

Reviewed JournalStream.tsx, SimpleRichEditor.tsx, src/lib/links.ts, src/lib/supabase/notes.ts, Supabase migrations, and link types.

---

## Current Gaps

- Links persist via localStorage (src/lib/links.ts), so relationships vanish across browsers/users and store only {text,noteId,entryId}—no offsets or context.
- JournalStream.handleNoteCreated wraps text using convertTextToLink, saving `<a data-note-id>` in the HTML but no durable anchor id.
- On load we replace text with `<a>` by first string match; if the text changes or is deleted, there's no fallback.
- SimpleRichEditor has no mutation watcher; when users delete linked text, we silently lose the anchor before state saves.

---

## Target Experience

1. Link relationship persists in Supabase regardless of editor HTML state.
2. Removing inline text marks the link as "dangling" (no auto-delete).
3. Users see dangling links, can reattach to new text, or reinsert the stored snippet.
4. Back-links on the note make it obvious when context is missing.
5. Features align with Story 2.4.1's auth goals (per-user isolation, Supabase-backed data).

---

## Phase 0 – Data Model & Type Alignment

- **Migration**: Add metadata JSONB DEFAULT '{}' and optional anchor_path TEXT to links table (new supabase/migrations/*_add_link_metadata.sql).
    - metadata holds { snippet, contextBefore, contextAfter, textContentPos, htmlPath }.
    - Optionally add status TEXT DEFAULT 'active' CHECK (status IN ('active','dangling','detached')).
- **Types**:
    - Consolidate link definitions: extend Link in src/types/note.ts with status and metadata.
    - Remove/replace src/types/link.ts (localStorage) with shared LinkMetadata interface.
    - Update CreateLinkRequest to accept metadata payload.
- **API Layer**:
    - Delete legacy src/lib/links.ts; rely on Supabase helpers (src/lib/supabase/notes.ts) and expand them with metadata/status handling.
    - Add dedicated functions: markLinkDangling, updateLinkAnchoring, getOutgoingLinksWithMetadata.

---

## Phase 1 – Link Creation & Persistence

- **JournalStream.handleNoteCreated**:
    - Retrieve selection details before DOM manipulation: raw HTML, Range offsets, context strings.
    - Call new Supabase createLink with metadata.
    - Wrap DOM using enhanced convertTextToLink, including data-link-id plus data-note-id.
- **convertTextToLink** (src/utils/textToLink.ts):
    - Accept linkId; embed as attribute.
    - Return final Range start offset (via Range#getBoundingClientRect? better: compute via text path helper) so caller can update metadata.
- **updateNoteInDb** call remains but ensure we store HTML containing data-link-id.

---

## Phase 2 – Load-Time Rehydration & Dangling Detection

- Replace the entriesWithLinks localStorage logic in JournalStream:
    - Fetch outgoing links via Supabase for each entry (batch call getOutgoingLinks).
    - Introduce helper rehydrateLinks(entryContent, linksMetadata):
        1. If data-link-id already present → verify and update offsets.
        2. Else try textContent offset from metadata.
        3. Else attempt fuzzy search using contextBefore/contextAfter.
        4. On success, inject `<a>` with data-link-id, update metadata offsets, mark status='active'.
        5. On failure, mark status='dangling' (only in DB; HTML untouched).
- Make rehydration idempotent: only mutate HTML when necessary; persist updates after success.

---

## Phase 3 – Editor Instrumentation

- **SimpleRichEditor Enhancements**:
    - Add MutationObserver watching for removals/alterations of nodes bearing data-link-id.
    - Provide callbacks onLinkRemoved(linkId) and onLinkModified(linkId, newHtmlRange).
    - Ensure observer runs after delayed rehydration to avoid false positives.
- **JournalStream Integration**:
    - When observer reports removal → call markLinkDangling (status update) and keep HTML untouched (allow user to undo).
    - Fire toast: "Link to '{note.title}' removed. Undo • Reattach…".
    - Start short-lived Undo window (maintain last DOM snapshot) before finalizing status.

---

## Phase 4 – Recovery UX

1. **Link Recovery Panel** (new LinkRecoveryPanel component):
    - Trigger in each entry (e.g., "Links (3)" button next to editor).
    - Lists active and dangling links (pull via Supabase).
    - For dangling items:
        - Attach to selection (enabled when selection inside editor).
        - Insert snippet (reinserts stored snippet + anchor at caret, defaulting to snippet text).
        - Detach (sets status detached, removes link relationship).
2. **Back-link Surfacing in NoteViewer**:
    - Fetch incoming links (use getIncomingLinks).
    - Show "Linked from Journal Entry {date} — {status}".
    - Provide "Restore" button (scrolls/open entry, toggles panel).
3. **Inline Indicators** (optional but low-effort):
    - Add subtle icon/badge in editor header when dangling links exist ("1 link needs attention").

---

## Phase 5 – Reattach Logic & Utilities

- **Helper module** src/lib/linkAnchors.ts:
    - calculateTextOffsets(range, rootElement) (returns plain-text index).
    - findAnchorCandidate(content, metadata) (fuzzy match using snippet/context; fallback to similarity search).
    - wrapRangeWithLink(range, linkId, noteId) (centralized for creation + reattach).
- **Reattach Flow**:
    - When user selects text and clicks "Attach":
        - Validate selection length > 0, call updateLinkAnchoring(linkId, { offsets, snippet, context... }).
        - Update DOM via helper and persist entry content.
    - When user chooses "Insert snippet":
        - Use stored snippet and optional location metadata to insert text + anchor.

---

## Phase 6 – Testing & QA

- **Unit Tests** (Jest):
    - Utilities for offset calculation, fuzzy match, DOM rewrap (use JSDOM).
    - Link metadata serialization/deserialization.
- **Integration Tests**:
    - Simulate create → delete anchor → reattach → verify DB/HTML.
    - Multi-link entry with duplicates.
    - Regression for existing note creation flow.
- **Manual QA** (dev environment):
    - Multi-user check ensuring links scoped per user.
    - Browser refresh after partial edits.
    - Undo after removal.
- **Monitoring**:
    - Log warnings when fuzzy match confidence below threshold.
    - Add analytics event for dangling link count to monitor regressions.

---

## Risks & Mitigations

- **Schema change ripple**: coordinate migration rollout; provide fallback for older rows (default metadata).
- **DOM observer noise**: throttle callback, ignore attribute changes we trigger programmatically.
- **Complexity creep**: Phases 3-5 add significant complexity. Consider MVP scope reduction.
- **Performance**: Fuzzy matching on every load could be expensive for long journals. Add caching/memoization.

---

## Open Questions

- Should we auto-delete dangling links after N days, or keep indefinitely?
- What's the UX for multiple dangling links in a single entry? Inline vs. panel?
- Do we need a global "Review all dangling links" page?

---

## Implementation Notes

- Test suites & manual QA scripts required before merge.
- Coordinate with Phase 3 (Route Protection) timing to avoid conflicts.

---

**Once this plan is approved, implementation can proceed without unexpected doc or code changes beyond the outlined modules.**
