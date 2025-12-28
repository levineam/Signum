# Writing Spark Guide

**Story:** Journal Helper Tiles (Stories 2.8 + 2.9)
**Last Updated:** 2025-12-28
**Owner:** Engineering

## Overview

Writing sparks are the journal helper tiles that insert guided starter text into the current day's entry. They are designed to reduce blank-page friction without interrupting the journaling flow.

## Quick Reference

| Topic | Detail |
| --- | --- |
| Entry point | Helper tiles in `JournalStream` (today's entry only) |
| Primary UI | `HelperTileGrid` + `Dialog` + helper content components |
| Insert behavior | Prepend helper text to the editor content |
| Persistence | Guest: localStorage draft, Auth: Supabase `updateNoteInDb` |
| URL state | `?helper=` query param while dialog is open |

## Architecture

```
User clicks helper tile
  -> HelperTileGrid sets active helper
  -> Dialog opens (HelperDialogContent)
  -> Helper content builds starter text
  -> onInsert(helperText)
  -> JournalStream.handleHelperInsertion()
       - ensures edit mode
       - finds editor DOM
       - prepends helper text
       - persists (guest/localStorage or auth/Supabase)
```

## Guiding Principles (Anti-Patterns to Avoid)

- Do not navigate away from the journal entry to show helper content.
- Do not overwrite existing entry content; always prepend or merge safely.
- Do not auto-open helpers on load; let users opt in.
- Avoid blocking the editor with irreversible modal flows.

## Component Breakdown

- `src/components/journal/JournalStream.tsx`
  - Owns helper state (`activeHelper`, `activeHelperMode`, `activeEntryId`).
  - Inserts helper text via `handleHelperInsertion`.
- `src/components/journal/helpers/HelperTileGrid.tsx`
  - Renders helper tiles and handles expand/collapse state.
  - Persists expansion state with `signum-helpers-expanded`.
- `src/components/journal/helpers/HelperDialogContent.tsx`
  - Routes helper types to the correct helper content component.
- `src/components/journal/helpers/*Helper.tsx`
  - Individual helper content (gratitude, woop, day-planning, etc.).
- `src/components/editor/SimpleRichEditor.tsx`
  - Target editor for inserted helper text.

## Integration Points

- **Insert flow:** `HelperDialogContent` calls `onInsert`, wired to `handleHelperInsertion` in `JournalStream`.
- **URL state:** `JournalStream` updates the URL `?helper=` parameter while the dialog is open.
- **Guest persistence:** uses `useGuestDraft` to save the updated content locally.
- **Authenticated persistence:** uses `updateNoteInDb` to persist helper-inserted text.

## Caching Strategy

- **localStorage:**
  - `signum-helpers-expanded` stores helper tile collapsed state.
  - Guest drafts are persisted through `useGuestDraft` (localStorage-backed).
- **sessionStorage:**
  - Not currently used for writing sparks. If transient caching is needed later,
    prefer sessionStorage for non-critical, per-session prompt data.

## Responsive Layout

| Width | Helper Tiles | Dialog/Sheet |
| --- | --- | --- |
| <640px | 1 column | Full-screen dialog |
| 640-1023px | 2 columns | Dialog |
| >=1024px | 3 columns | Dialog (sheet component exists but unused) |

## Troubleshooting

- **Helper dialog opens but nothing inserts**
  - Check the console for `editor not found` errors in `handleHelperInsertion`.
  - Confirm the entry is in edit mode and `data-entry-id` matches.

- **Inserted text appears but does not persist**
  - For guest mode, confirm localStorage is writable and `useGuestDraft` is active.
  - For authenticated users, check Supabase errors in the console and `saveError` UI.

- **Helper tiles missing**
  - Helpers only render for today's entry and when the user is not in forced test mode.
  - Verify `activeSection` is the journal and that `isForcedTestUser` is false.

## Key Files

- `src/components/journal/JournalStream.tsx`
- `src/components/journal/helpers/HelperTileGrid.tsx`
- `src/components/journal/helpers/HelperDialogContent.tsx`
- `src/components/journal/helpers/HelperInfoDialog.tsx`
- `src/components/editor/SimpleRichEditor.tsx`
- `src/hooks/useMediaQuery.ts`
