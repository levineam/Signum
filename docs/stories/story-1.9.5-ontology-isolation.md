# Story 1.9.5: Ontology Isolation: Exclude AI-Generated Notes + Toggle

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#125](https://github.com/levineam/Signum/issues/125)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a user who values my personal ontology,
I want AI-generated notes to be excluded from ontology analysis by default,
so that my ontology reflects my own thoughts rather than AI-generated content.

## Acceptance Criteria

1. **Default Exclusion from Ontology**
   - [ ] Notes with `ai_generated = true` are excluded from ontology extraction pipeline
   - [ ] Ontology analysis queries filter out `ai_generated = true` notes
   - [ ] Existing ontology extraction (Story 2.4.3) respects this flag
   - [ ] Incremental ontology updates (Story 2.4.4) skip AI-generated notes

2. **"Add to Ontology" Toggle**
   - [ ] AI-generated notes display "Add to Ontology" toggle/button
   - [ ] Clicking toggle sets `ai_generated = false` and includes note in ontology
   - [ ] Toggle state persists in database
   - [ ] Toggle is visible only on AI-generated notes

3. **Visual Indicators**
   - [ ] AI-generated notes display "Excluded from Ontology" badge/indicator
   - [ ] After toggling, badge updates to show inclusion status
   - [ ] Clear visual difference between excluded and included notes

4. **Manual Override**
   - [ ] Users can manually set `ai_generated = false` on any note (via toggle)
   - [ ] Users can manually set `ai_generated = true` on any note (future: manual tagging)
   - [ ] Changes immediately affect ontology analysis (next analysis run)

5. **Backward Compatibility**
   - [ ] Existing notes without `ai_generated` field default to `false` (included in ontology)
   - [ ] Migration sets default value correctly
   - [ ] No impact on existing ontology data

6. **Integration with Ontology Extraction**
   - [ ] Modify ontology extraction queries to filter `ai_generated = true`
   - [ ] Test with mix of AI-generated and user-created notes
   - [ ] Verify AI notes excluded from extracted concepts/themes/entities

## Tasks / Subtasks

- [ ] **Update Ontology Extraction Logic** (AC: #1, #6)
  - [ ] Modify `/src/lib/ontology/extractor.ts` (existing ontology logic)
  - [ ] Add filter: `WHERE ai_generated = false OR ai_generated IS NULL`
  - [ ] Test extraction with AI-generated notes to verify exclusion
  - [ ] Document filtering logic in code comments

- [ ] **Update Ontology Analysis API** (AC: #1)
  - [ ] Modify existing ontology routes:
    - `/src/app/api/extract-ontology/route.ts` (full analysis)
    - `/src/app/api/ontology/incremental-analysis/route.ts` (incremental updates)
  - [ ] Ensure Supabase queries filter out `ai_generated = true` notes
  - [ ] Add tests for filtered queries

- [ ] **Create "Add to Ontology" Toggle Component** (AC: #2, #3)
  - [ ] Create `/src/components/notes/AddToOntologyToggle.tsx`
  - [ ] Implement toggle UI (Switch component from shadcn/ui)
  - [ ] Add click handler to update `ai_generated` field in database
  - [ ] Show loading state during update
  - [ ] Show success/error feedback

- [ ] **Integrate Toggle into NoteCard** (AC: #2, #4)
  - [ ] Modify `/src/components/notes/NoteCard.tsx`
  - [ ] Conditionally render toggle if `note.ai_generated === true`
  - [ ] Place toggle near "AI-generated" badge (from Story 1.9.4)
  - [ ] Update UI immediately after toggle change

- [ ] **Add Visual Indicators** (AC: #3)
  - [ ] Update "AI-generated" badge to show exclusion status
  - [ ] Add tooltip explaining exclusion from ontology
  - [ ] Update badge text when toggled (e.g., "AI-generated (Included in Ontology)")

- [ ] **Implement Toggle API Handler** (AC: #2, #4)
  - [ ] Create `/src/app/api/notes/[id]/toggle-ontology/route.ts` (or add to existing notes API)
  - [ ] Accept PATCH request with `ai_generated` boolean
  - [ ] Validate user owns note
  - [ ] Update note record in database
  - [ ] Return updated note

- [ ] **Update Migration (from Story 1.9.4)** (AC: #5)
  - [ ] Verify migration sets `ai_generated DEFAULT FALSE`
  - [ ] Ensure existing notes default to `false` (included in ontology)
  - [ ] Test backward compatibility

- [ ] **Add Tests** (AC: #6)
  - [ ] Unit test: Ontology extraction filters AI notes
  - [ ] Integration test: Toggle updates database and UI
  - [ ] E2E test: Create AI note, verify excluded, toggle, verify included

## Dev Notes

### Technical Summary

Modify the ontology extraction pipeline to exclude notes marked as `ai_generated = true` by default. Provide users with a toggle to manually include AI-generated notes in their ontology if desired.

### Implementation Approach

**Ontology Extraction Filtering:**

```typescript
// /src/lib/ontology/extractor.ts (existing ontology logic)
export async function extractOntologyFromNotes(userId: string) {
  const supabase = createClient()

  // Fetch user's notes, excluding AI-generated ones
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .or('ai_generated.is.null,ai_generated.eq.false') // Exclude ai_generated = true
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch notes for ontology extraction')
  }

  // ... rest of extraction logic ...
}
```

**Add to Ontology Toggle Component:**

```typescript
// /src/components/notes/AddToOntologyToggle.tsx
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface AddToOntologyToggleProps {
  noteId: string
  aiGenerated: boolean
  onUpdate?: (newValue: boolean) => void
}

export function AddToOntologyToggle({ noteId, aiGenerated, onUpdate }: AddToOntologyToggleProps) {
  const [isIncluded, setIsIncluded] = useState(!aiGenerated)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/notes/${noteId}/toggle-ontology`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_generated: !isIncluded })
      })

      if (!response.ok) {
        throw new Error('Failed to update note')
      }

      setIsIncluded(!isIncluded)
      onUpdate?.(!isIncluded)

      toast({
        title: isIncluded ? 'Excluded from ontology' : 'Added to ontology',
        description: isIncluded
          ? 'This note will not be included in your ontology analysis.'
          : 'This note will now be included in your ontology analysis.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`ontology-${noteId}`}
        checked={isIncluded}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
      <Label htmlFor={`ontology-${noteId}`}>
        Include in Ontology
      </Label>
    </div>
  )
}
```

**Toggle API Route:**

```typescript
// /src/app/api/notes/[id]/toggle-ontology/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from request headers (follows /api/tasks/parse pattern)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with user token (RLS-safe)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { ai_generated } = await request.json()

    // Update note (RLS automatically verifies ownership)
    const { data: note, error } = await supabase
      .from('notes')
      .update({ ai_generated })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !note) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(note)

  } catch (error) {
    console.error('[Toggle Ontology Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Updated NoteCard with Toggle:**

```typescript
// /src/components/notes/NoteCard.tsx (modifications)
import { AddToOntologyToggle } from './AddToOntologyToggle'

export function NoteCard({ note }: { note: Note }) {
  const [aiGenerated, setAiGenerated] = useState(note.ai_generated)

  return (
    <div className="note-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>{note.title}</h3>
          {aiGenerated && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-generated
            </Badge>
          )}
        </div>

        {/* Show toggle for AI-generated notes */}
        {note.ai_generated && (
          <AddToOntologyToggle
            noteId={note.id}
            aiGenerated={aiGenerated}
            onUpdate={(newValue) => setAiGenerated(!newValue)}
          />
        )}
      </div>

      {/* Note content */}
      <div className="note-content prose">
        {/* Render markdown content */}
      </div>
    </div>
  )
}
```

### Files to Modify

**New Files:**
- `/src/components/notes/AddToOntologyToggle.tsx` - Toggle component
- `/src/app/api/notes/[id]/toggle-ontology/route.ts` - API route for toggle

**Modified Files:**
- `/src/lib/ontology/extractor.ts` - Add AI-generated filtering logic
- `/src/app/api/extract-ontology/route.ts` - Update query to exclude AI notes (full analysis)
- `/src/app/api/ontology/incremental-analysis/route.ts` - Update query to exclude AI notes (incremental)
- `/src/components/notes/NoteCard.tsx` - Integrate toggle

### Dependencies

- **Story 1.9.4 (AI Note Creation):** Requires `ai_generated` field
- **Story 2.4.3 (Ontology Extraction):** Integration point for filtering
- **shadcn/ui Switch:** UI component for toggle

### Database Query Examples

**Before (includes all notes):**
```sql
SELECT * FROM notes WHERE user_id = '...' ORDER BY created_at DESC;
```

**After (excludes AI-generated):**
```sql
SELECT * FROM notes
WHERE user_id = '...'
  AND (ai_generated = false OR ai_generated IS NULL)
ORDER BY created_at DESC;
```

### UI/UX Considerations

- **Default State:** AI notes excluded by default (builds trust)
- **User Control:** Toggle gives users power to include AI content if valuable
- **Clear Feedback:** Toast notifications confirm toggle action
- **Visual Clarity:** Badge + toggle together make status obvious

### Edge Cases

- **Null Values:** Handle `ai_generated IS NULL` as `false` (included)
- **Concurrent Updates:** Use optimistic UI updates with rollback on error
- **RLS Policies:** Ensure users can only toggle their own notes

### Time Estimate

**2-3 days**
- Day 1: Update ontology extraction filtering, API modifications
- Day 2: Create toggle component, integrate into NoteCard
- Day 3: Testing, edge cases, integration with existing ontology system

**Story Points:** 3 points

### References

- **Ontology Extraction Routes:**
  - `/src/app/api/extract-ontology/route.ts` (full analysis)
  - `/src/app/api/ontology/incremental-analysis/route.ts` (incremental updates)
- **shadcn/ui Switch:** `/src/components/ui/switch.tsx`
- **Supabase OR Filter:** https://supabase.com/docs/reference/javascript/or

---

## Dev Agent Record

### Context Reference

<!-- Will be populated during dev-story execution -->

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
