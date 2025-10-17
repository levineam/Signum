# Data Model Unification: Notes Architecture

**Issue Identified:** 2025-09-30
**Status:** Requires Implementation
**Impact:** Critical for Story 2.4 (AI Ontology Extraction)

## Problem Statement

Currently, the codebase treats "journal entries" and "notes" as **separate, parallel entities**:

### Current Separate Structures

**Journal Entry** (`src/components/journal/JournalStream.tsx`):
```typescript
interface JournalEntry {
  id: string
  date: string        // YYYY-MM-DD format
  content: string
  lastModified: string
  isSample?: boolean
}
```

**Note** (`src/types/note.ts`):
```typescript
interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  userId?: string
  type: 'values' | 'beliefs' | 'aims' | 'regular'
  isPinned: boolean
}
```

### Why This Is Problematic

1. **Conceptual Confusion**: "Journal entries" ARE a type of note, not a separate entity
2. **Duplicate Logic**: Separate storage, CRUD operations, and UI components
3. **AI Analysis Complexity**: Story 2.4 must handle two different data sources
4. **Semantic Inconsistency**: The PRD says "analyze notes" but sample data is "journal entries"
5. **Future Scaling Issues**: Adding more note types requires parallel implementations

## Proposed Solution: Unified Note Model

### Single Source of Truth

```typescript
// src/types/note.ts (UPDATED)
export interface Note {
  id: string
  title: string                    // Auto-generated from date for journal entries
  content: string                  // HTML for rich text
  createdAt: string               // ISO timestamp
  updatedAt: string               // ISO timestamp
  userId?: string                 // For multi-user support
  noteType: NoteType              // Unified type system
  isPinned: boolean               // UI-level pinning
  metadata?: NoteMetadata         // Type-specific data
}

export type NoteType =
  | 'journal-entry'       // Daily journaling
  | 'reflection'          // Created from highlighted journal text
  | 'ontology-value'      // AI-extracted value
  | 'ontology-belief'     // AI-extracted belief
  | 'ontology-aim'        // AI-extracted aim
  | 'custom'              // User-created standalone note

export interface NoteMetadata {
  // For journal entries
  journalDate?: string          // YYYY-MM-DD for daily entries
  prompt?: string               // ACT-inspired prompt used

  // For reflections (created from highlights)
  sourceNoteId?: string         // Parent journal entry
  sourceQuote?: string          // Highlighted text

  // For ontology items
  confidence?: 'high' | 'medium' | 'low'
  extractedFrom?: string[]      // Array of source note IDs
  aiReasoning?: string          // Why AI extracted this

  // General
  tags?: string[]               // User-defined tags
  isSample?: boolean            // For demo/test data
}
```

### Migration Benefits

1. **Single API Surface**: One set of CRUD operations for all note types
2. **Unified Storage**: One Supabase table with proper indexing on `noteType`
3. **Simplified AI Analysis**: Analyze all notes with `noteType IN ('journal-entry', 'reflection', 'custom')`
4. **Better Relationships**: FK references work across all note types
5. **Future-Proof**: Easy to add new note types (e.g., 'meeting-note', 'book-note')

## Database Schema (Supabase)

```sql
-- Unified notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN (
    'journal-entry',
    'reflection',
    'ontology-value',
    'ontology-belief',
    'ontology-aim',
    'custom'
  )),
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_note_type ON notes(note_type);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_journal_date ON notes((metadata->>'journalDate'))
  WHERE note_type = 'journal-entry';

-- RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own notes"
  ON notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Migration Strategy

### Phase 1: Add Unified Types (Non-Breaking)
1. Create new `Note` interface with `noteType` field
2. Add migration helper functions to convert between old and new formats
3. Update TypeScript types throughout codebase

### Phase 2: Dual-Write Period
1. Write to both old structures AND new unified structure
2. Read from new structure with fallback to old
3. Allow gradual testing in production

### Phase 3: Cut-Over
1. Migrate all existing data to unified structure
2. Remove old JournalEntry interface and related code
3. Update all components to use unified Note model

### Phase 4: Cleanup
1. Remove compatibility layer
2. Archive old localStorage data
3. Update documentation

## Implementation Checklist

### Story 2.4 Prerequisites
- [ ] Create Supabase migration for `notes` table
- [ ] Update `src/types/note.ts` with unified interface
- [ ] Create `src/lib/supabase/notes.ts` for database operations
- [ ] Update journal entry creation to use unified Note model
- [ ] Migrate 20 sample notes to include `noteType` field
- [ ] Update AI extraction to target `noteType IN ('journal-entry', 'reflection', 'custom')`

### Post-Story 2.4
- [ ] Refactor `JournalStream` component to use unified model
- [ ] Remove legacy `JournalEntry` interface
- [ ] Update all note-related components
- [ ] Add data migration script for production users

## Example Usage (Story 2.4)

```typescript
// Fetch all analyzable notes
const notesToAnalyze = await supabase
  .from('notes')
  .select('*')
  .in('note_type', ['journal-entry', 'reflection', 'custom'])
  .order('created_at', { ascending: false })
  .limit(20)

// Create ontology item from extraction
const ontologyValue = await supabase
  .from('notes')
  .insert({
    user_id: userId,
    title: 'Compassion',
    content: 'Listening deeply, understanding unique situations, empowering others',
    note_type: 'ontology-value',
    is_pinned: true,
    metadata: {
      confidence: 'high',
      extractedFrom: [note1.id, note2.id, note5.id],
      aiReasoning: 'Recurring theme across multiple entries about helping others'
    }
  })
```

## References

- Current JournalEntry: `src/components/journal/JournalStream.tsx:11-17`
- Current Note: `src/types/note.ts:1-10`
- Story 2.4: `docs/prd.md:567-757`
- Supabase Project: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox