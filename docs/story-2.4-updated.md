# Story 2.4: Personal Ontology Extraction Foundation (UPDATED)

**Status:** 🚧 PRIORITIZED - NEXT
**Updated:** 2025-09-30
**Prerequisites:** Story 2.3.5 (Notes Page UI) ✅ Complete

## User Story

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from **all my notes** (including journal entries, reflections, and custom notes),
so that I can build a structured personal ontology that helps me understand my authentic self and track my philosophical evolution over time.

## Context & Dependencies

### Data Model Clarification
- **Critical**: This story requires unified Note data model (see `/docs/data-model-unification.md`)
- Journal entries should be a `noteType` variant, not a separate entity
- All notes with `noteType IN ('journal-entry', 'reflection', 'custom')` are analyzed
- See `/docs/data-model-unification.md` for full migration strategy

### Sample Data
- 20 sample notes created in Story 2.3.5 (see `/scripts/seed-ontology-notes.js`)
- Notes contain rich semantic content for testing extraction quality
- Immediately testable once extraction implemented

### Technical References
- **GPT-5-mini API Docs**: `/docs/openai-gpt5-api.md`
- **Supabase Project**: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
- **Data Model**: `/docs/data-model-unification.md`

---

## MVP Scope (Story 2.4.1)

### Goal
Build the simplest possible working extraction that demonstrates value to users.

### Core Functionality

**1. Manual Trigger**
- "Analyze My Notes" button on Notes page
- Processes up to 20 most recent notes (excluding ontology notes)
- One-time analysis per session (no automatic/incremental)

**2. Direct Population**
- Extracted values → `ontology-value` notes (populate Values card)
- Extracted beliefs → `ontology-belief` notes (populate Beliefs card)
- Extracted aims → `ontology-aim` notes (populate Aims card)
- NO suggestion/approval workflow in MVP (auto-accept all high-confidence extractions)

**3. Simple Feedback**
- Loading spinner during extraction
- Success message: "Found X values, Y beliefs, Z aims"
- Error message if API fails

### Out of Scope for MVP
- ❌ Suggestion review/approval UI
- ❌ Incremental processing (analyze only new notes)
- ❌ Confidence thresholds and filtering
- ❌ Edit/reject functionality
- ❌ Daily rate limiting (use default OpenAI limits)
- ❌ Dashboard/analytics view

---

## Acceptance Criteria

### Data Model Prerequisites
1. ✅ Unified `Note` interface with `noteType` field exists
2. ✅ Supabase `notes` table created with proper schema
3. ✅ Sample notes migrated to include `noteType` field
4. ✅ Helper functions for querying notes by type

### Core Extraction Functionality
1. ✅ System analyzes notes using OpenAI GPT-5-mini (cost-efficient model)
2. ✅ Extraction triggered manually via "Analyze My Notes" button
3. ✅ Processes notes where `noteType IN ('journal-entry', 'reflection', 'custom')`
4. ✅ Maximum 20 notes per extraction to control costs
5. ✅ Extracted concepts categorized as Values, Beliefs, or Aims
6. ✅ Each extraction includes:
   - Concept text (short, memorable phrase)
   - Category (value/belief/aim)
   - Confidence score (high/medium/low)
   - Source note IDs (which notes support this)
   - Brief reasoning (why AI extracted this)

### Data Storage (Supabase)
1. ✅ High-confidence extractions (confidence >= 'high') stored as ontology notes:
   ```typescript
   {
     noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim',
     title: 'Compassion',  // The extracted concept
     content: 'Detailed description or quote',
     isPinned: true,  // Always pinned for ontology items
     metadata: {
       confidence: 'high' | 'medium' | 'low',
       extractedFrom: ['note-id-1', 'note-id-2'],
       aiReasoning: 'Recurring theme in notes about helping others'
     }
   }
   ```
2. ✅ Stored in same `notes` table (unified model)
3. ✅ Deduplicated by title (don't create duplicate "Compassion" value)

### UI Integration
1. ✅ "Analyze My Notes" button added to Notes page (`/notes`)
2. ✅ Button disabled during extraction with loading spinner
3. ✅ Success toast: "Ontology updated! Found 5 values, 8 beliefs, 3 aims"
4. ✅ Error toast: "Extraction failed. Please try again."
5. ✅ Values/Beliefs/Aims cards automatically refresh after extraction

### API Integration
1. ✅ Next.js API route: `/src/app/api/extract-ontology/route.ts`
2. ✅ Uses GPT-5-mini with Responses API for cost efficiency
3. ✅ Reasoning effort: `medium` (balanced quality/cost)
4. ✅ API key stored in environment variable (server-side only):
   ```
   OPENAI_API_KEY=sk-...
   ```
5. ✅ Request structure:
   ```typescript
   {
     model: 'gpt-5-mini',
     input: buildExtractionPrompt(notes),
     reasoning: { effort: 'medium' }
   }
   ```
6. ✅ Proper error handling for API failures
7. ✅ Input sanitization and validation

---

## Technical Specifications

### Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Notes Page  │───▶│   Next.js    │───▶│  OpenAI API  │───▶│  Supabase    │
│   (Button)   │    │  API Route   │    │  (GPT-5-mini)│    │   (notes)    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                                                              │
       └──────────────────────────────────────────────────────────────┘
                          Refresh UI after storage
```

### Component Structure

```
src/
├── app/
│   ├── notes/
│   │   └── page.tsx                      # Add "Analyze" button
│   └── api/
│       └── extract-ontology/
│           └── route.ts                  # Next.js API route (NEW)
├── components/
│   └── notes/
│       ├── NotesPage.tsx                 # Update with analysis button
│       └── OntologyAnalysisButton.tsx    # New component
├── lib/
│   ├── supabase/
│   │   └── notes.ts                      # CRUD operations (NEW/UPDATED)
│   └── ontology/
│       ├── extractor.ts                  # Frontend service (NEW)
│       └── deduplication.ts              # Prevent duplicates (NEW)
└── utils/
    └── ontologyPrompts.ts                # GPT-5 prompt templates (NEW)
```

### API Route Implementation

```typescript
// /src/app/api/extract-ontology/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 1. Get user's notes to analyze
    const { userId } = await request.json()
    const supabase = createClient()

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .in('note_type', ['journal-entry', 'reflection', 'custom'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // 2. Call OpenAI GPT-5-mini
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: buildExtractionPrompt(notes),
        reasoning: { effort: 'medium' }
      })
    })

    const aiResult = await response.json()

    // 3. Parse and store results
    const { values, beliefs, aims } = parseExtractionResult(aiResult)

    await storeOntologyItems(supabase, userId, { values, beliefs, aims })

    return NextResponse.json({
      success: true,
      counts: {
        values: values.length,
        beliefs: beliefs.length,
        aims: aims.length
      }
    })
  } catch (error) {
    console.error('Extraction failed:', error)
    return NextResponse.json(
      { success: false, error: 'Extraction failed' },
      { status: 500 }
    )
  }
}

function buildExtractionPrompt(notes: Note[]): string {
  // See /docs/openai-gpt5-api.md for full prompt template
  return `Analyze these notes and extract values, beliefs, and aims...`
}
```

### Prompt Template

See `/docs/openai-gpt5-api.md` for complete prompt engineering guidance.

**Summary:**
```
System Context:
- You are an expert at analyzing personal notes for ontology extraction
- Extract Values (guiding principles), Beliefs (truths held), Aims (goals)
- Return structured JSON with high-confidence items only

User Input:
[Note 1: Title + Content]
[Note 2: Title + Content]
...

Expected Output:
{
  "values": [
    {
      "text": "Compassion",
      "confidence": "high",
      "sourceNoteIds": ["note-1", "note-5"],
      "reasoning": "Recurring theme about listening and empowering others"
    }
  ],
  "beliefs": [...],
  "aims": [...]
}
```

---

## Data Model Updates

### Prerequisite: Supabase Migration

```sql
-- See /docs/data-model-unification.md for full schema

-- Key additions for Story 2.4:
ALTER TABLE notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'custom'
  CHECK (note_type IN (
    'journal-entry',
    'reflection',
    'ontology-value',
    'ontology-belief',
    'ontology-aim',
    'custom'
  ));

ALTER TABLE notes ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_notes_note_type ON notes(note_type);
```

### TypeScript Interfaces

```typescript
// See /docs/data-model-unification.md for full definitions

export type NoteType =
  | 'journal-entry'
  | 'reflection'
  | 'ontology-value'
  | 'ontology-belief'
  | 'ontology-aim'
  | 'custom'

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  noteType: NoteType
  isPinned: boolean
  metadata: NoteMetadata
  createdAt: string
  updatedAt: string
}

export interface NoteMetadata {
  // For ontology items
  confidence?: 'high' | 'medium' | 'low'
  extractedFrom?: string[]  // Source note IDs
  aiReasoning?: string

  // For other note types
  [key: string]: any
}
```

---

## Testing Strategy

### Unit Tests
1. Prompt generation from notes
2. Deduplication logic (don't duplicate "Compassion")
3. Confidence score parsing
4. Error handling for API failures

### Integration Tests
1. Full extraction workflow with mock OpenAI API
2. Supabase storage and retrieval
3. UI button state management

### Manual Testing (Critical)

**Using 20 Sample Notes:**
1. Navigate to `/notes`
2. Click "Analyze My Notes" button
3. Wait for extraction (expect 5-10 seconds)
4. Verify success message appears
5. Refresh page and check Values/Beliefs/Aims cards populated
6. Review extracted content for quality and relevance

**Expected Results:**
- Values card: 5-8 values extracted (e.g., "Compassion", "Integrity", "Presence")
- Beliefs card: 5-10 beliefs (e.g., "Meaning over happiness", "People have inherent wisdom")
- Aims card: 3-5 aims (e.g., "Balance ambition with presence", "Build community connections")

**Quality Checks:**
- Extractions should reflect actual themes in sample notes
- No obvious misclassifications (values vs beliefs vs aims)
- High-confidence items only (medium/low filtered out in MVP)
- No duplicate entries with same title

---

## Edge Cases & Error Handling

### API Failures
- **Scenario**: OpenAI API unavailable or rate limited
- **Handling**: Show error toast, allow retry
- **No queue**: User must manually retry (MVP simplicity)

### Insufficient Notes
- **Scenario**: User has < 5 notes
- **Handling**: Show warning: "Need at least 5 notes for meaningful extraction"
- **UI**: Disable button until threshold met

### Empty Extraction
- **Scenario**: AI finds no high-confidence items
- **Handling**: Show message: "No clear patterns found yet. Keep journaling!"
- **Guidance**: Suggest writing more to establish themes

### Duplicate Detection
- **Scenario**: Re-running extraction might find same values
- **Handling**: Check existing ontology notes by title before inserting
- **Deduplication**: Case-insensitive title matching

### Partial Failure
- **Scenario**: Some categories succeed, others fail
- **Handling**: Store what succeeded, show partial success message
- **Example**: "Found 5 values, 8 beliefs. Could not extract aims (API error)."

---

## Success Metrics

### Quantitative
1. **Extraction Success Rate**: > 95% of extractions complete without errors
2. **Quality**: Manual review of 20 sample extractions shows > 80% relevance
3. **Performance**: Extraction completes within 10 seconds
4. **Cost**: < $0.10 per 20-note extraction with GPT-5-mini

### Qualitative
1. **User Feedback**: "I see myself in these extractions"
2. **Ontology Cards**: Values/Beliefs/Aims cards feel accurate and insightful
3. **Developer Experience**: Clear error messages, easy debugging

---

## Future Enhancements (Post-MVP)

### Story 2.4.2: Suggestion Review Workflow
- Add approval/reject UI for extractions
- Show confidence levels and let user filter
- Edit functionality before acceptance
- Queue management for pending suggestions

### Story 2.4.3: Incremental Analysis
- Analyze only new notes since last extraction
- Background processing without user trigger
- Smart scheduling (after every 5 new notes)

### Story 2.4.4: Analytics & Insights
- Ontology evolution tracking over time
- Visualization of concept relationships
- Export functionality for backups

---

## Implementation Checklist

### Prerequisites
- [ ] Review `/docs/data-model-unification.md`
- [ ] Review `/docs/openai-gpt5-api.md`
- [ ] Confirm Supabase project access
- [ ] Verify OPENAI_API_KEY in environment

### Phase 1: Data Model
- [ ] Create Supabase migration for unified `notes` table
- [ ] Add `noteType` and `metadata` columns
- [ ] Update TypeScript `Note` interface
- [ ] Migrate 20 sample notes to include `noteType`
- [ ] Test queries: `SELECT * FROM notes WHERE note_type IN (...)`

### Phase 2: API Route
- [ ] Create `/src/app/api/extract-ontology/route.ts`
- [ ] Implement OpenAI GPT-5-mini integration
- [ ] Build prompt template with sample notes
- [ ] Test API route with Postman/curl
- [ ] Add error handling and logging

### Phase 3: Storage Logic
- [ ] Create `/src/lib/ontology/deduplication.ts`
- [ ] Implement `storeOntologyItems()` function
- [ ] Test duplicate detection (title matching)
- [ ] Verify Supabase RLS policies allow inserts

### Phase 4: UI Integration
- [ ] Create `OntologyAnalysisButton` component
- [ ] Add button to Notes page
- [ ] Implement loading state management
- [ ] Add success/error toasts
- [ ] Test button click → extraction → card refresh flow

### Phase 5: Testing
- [ ] Unit tests for deduplication
- [ ] Integration tests with mock API
- [ ] Manual testing with 20 sample notes
- [ ] Quality review of extracted items
- [ ] Cost calculation for typical usage

### Phase 6: Documentation
- [ ] Update README with extraction feature
- [ ] Document environment variables needed
- [ ] Add troubleshooting guide for common errors

---

## References

- **OpenAI GPT-5-mini Docs**: `/docs/openai-gpt5-api.md`
- **Data Model**: `/docs/data-model-unification.md`
- **Supabase Project**: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
- **Sample Notes Script**: `/scripts/seed-ontology-notes.js`
- **Sample Notes README**: `/scripts/README.md`
- **Original Story 2.4**: `/docs/prd.md:567-757`