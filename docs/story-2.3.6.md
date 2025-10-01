# Story 2.3.6: Unified Note Data Model (Simplified for Prototype)

## What We Built

### ✅ Supabase Foundation (Ready for Production)
- **Database Schema**: `supabase/migrations/20250930000000_unified_notes_schema.sql`
  - Single `notes` table with discriminator pattern (`note_type`)
  - `links` table for bidirectional relationships
  - Row-Level Security (RLS) policies
  - Indexes for performance

- **Type Definitions**: `src/types/note.ts`
  - Unified `Note` interface replacing separate JournalEntry/Note types
  - `NoteType` discriminator: `journal-entry | reflection | ontology-value | ontology-belief | ontology-aim | custom`
  - `Link` interface for note relationships
  - Request/response types for CRUD operations

- **CRUD Operations**: `src/lib/supabase/notes.ts`
  - `getJournalEntries()` - Fetch journal entries
  - `getRegularNotes()` - Fetch custom/reflection notes
  - `getOntologyNotes()` - Fetch pinned Values/Beliefs/Aims
  - `getNoteById()` - Get single note
  - `createNote()` - Create new note
  - `updateNote()` - Update existing note
  - `deleteNote()` - Delete note
  - `createLink()` / `deleteLink()` - Manage relationships
  - `initializeOntologyNotes()` - Create pinned ontology notes for new users

### ❌ What We Removed (Zero Users = No Migration Needed)
- Migration modal component
- Migration script with idempotency checks
- Journal title generation utilities
- Migration progress tracking
- All the complexity around handling partial failures and retries

## Current State

**Data Storage**: localStorage (existing implementation in `src/lib/notes.ts`)
**Auth**: Supabase Auth (working)
**Database**: Supabase tables created and ready, but UI doesn't use them yet

## When to Switch to Supabase

**Option A: When You Get Real Users**
1. Update `JournalStream` to use `getJournalEntries(userId)`
2. Update `NotesPage` to use `getRegularNotes(userId)` and `getOntologyNotes(userId)`
3. Tell users their data will reset (totally acceptable for early adopters)
4. Remove localStorage implementation

**Option B: If You Need Migration Later**
1. Check git history for migration code (commits `2ab9514` through `9194988`)
2. Restore migration script and modal
3. Test with your own data first
4. Deploy migration for users

## Why This Approach?

**Prototype Phase Priorities:**
- ✅ Fast iteration
- ✅ Simple codebase
- ✅ Easy to understand
- ✅ Foundation ready when needed

**Not Priorities:**
- ❌ Complex data migration for zero users
- ❌ Idempotency for non-existent retry scenarios
- ❌ Edge case handling for problems that don't exist yet

## Next Steps

When you're ready to use Supabase:
1. Replace localStorage calls with Supabase CRUD in 2 components
2. Test with a fresh account
3. Deploy

That's it! No migration complexity needed until you have users worth migrating.

---

**Key Files:**
- Schema: `supabase/migrations/20250930000000_unified_notes_schema.sql`
- Types: `src/types/note.ts`
- CRUD: `src/lib/supabase/notes.ts`
- Auth: `src/contexts/AuthContext.tsx` (clean, no migration code)
