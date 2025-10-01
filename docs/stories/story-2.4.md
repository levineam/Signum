# Story 2.4: AI Personal Ontology Extraction Foundation

**Status:** In Progress
**Priority:** High
**Estimate:** 3-5 hours
**Prerequisites:** Story 2.3.6 (Unified Note Data Model) ✅ Complete

---

## Story

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from **all my notes**,
so that I can build a structured personal ontology that helps me understand my authentic self and track my philosophical evolution over time.

---

## MVP Scope (Story 2.4.1)

**What's Included:**
- Manual "Analyze My Notes" button on Notes page
- Processes up to 20 most recent notes (excluding ontology notes)
- Direct population of Values/Beliefs/Aims cards (no approval workflow)
- GPT-5-mini for cost efficiency
- localStorage for MVP (Supabase foundation ready but not required)

**What's Deferred to Post-MVP:**
- Suggestion review/approval UI (Story 2.4.2)
- Incremental processing (Story 2.4.3)
- Analytics dashboard (Story 2.4.4)

---

## Acceptance Criteria

**Core Functionality:**
1. System analyzes notes using OpenAI GPT-5-mini
2. Manual trigger via "Analyze My Notes" button on Notes page
3. Processes notes from localStorage (journal entries + custom notes)
4. Maximum 20 notes per extraction
5. Each extraction includes:
   - Concept text (short, memorable phrase)
   - Category (value/belief/aim)
   - Confidence score (high/medium/low)
   - Source note IDs
   - AI reasoning
6. High-confidence extractions automatically stored as ontology notes in localStorage

**UI Integration:**
1. "Analyze My Notes" button on Notes page
2. Loading spinner during extraction
3. Success toast: "Found X values, Y beliefs, Z aims"
4. Error toast for API failures
5. Cards auto-refresh after extraction

**API Integration:**
1. Next.js API route: `/src/app/api/extract-ontology/route.ts`
2. Model: `gpt-5-mini`
3. Responses API with `reasoning.effort: 'medium'`
4. API key: `OPENAI_API_KEY` environment variable (server-side only)
5. Error handling for API failures

---

## Tasks

### Phase 1: Environment & Dependencies
- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Verify environment variable loading

### Phase 2: Prompt Engineering
- [ ] Create `/src/utils/ontologyPrompts.ts`
  - [ ] System prompt for ontology extraction
  - [ ] Input formatter (notes → prompt)
  - [ ] Response parser (JSON → typed objects)
- [ ] Write extraction prompt template
- [ ] Define expected JSON response structure

### Phase 3: API Route
- [ ] Create `/src/app/api/extract-ontology/route.ts`
  - [ ] Accept POST request with userId
  - [ ] Read notes from localStorage (via request body for MVP)
  - [ ] Call OpenAI GPT-5-mini API
  - [ ] Parse extraction results
  - [ ] Return structured response
- [ ] Add error handling
- [ ] Add input validation
- [ ] Test with Postman/curl

### Phase 4: Deduplication Logic
- [ ] Create `/src/lib/ontology/deduplication.ts`
  - [ ] Case-insensitive title matching
  - [ ] Merge duplicate extractions
  - [ ] Handle confidence score conflicts
- [ ] Write unit tests for deduplication

### Phase 5: Storage Integration
- [ ] Update `/src/lib/notes.ts` localStorage functions
  - [ ] Add function to store ontology notes
  - [ ] Update `getPinnedNotes()` to include ontology items
  - [ ] Add deduplication on save
- [ ] Test storage/retrieval

### Phase 6: UI Component
- [ ] Create `/src/components/notes/OntologyAnalysisButton.tsx`
  - [ ] Button with loading state
  - [ ] Click handler to call API route
  - [ ] Toast notifications (success/error)
  - [ ] Disable during processing
- [ ] Add Sonner toast library if not installed
- [ ] Style button to match design system

### Phase 7: Notes Page Integration
- [ ] Update `/src/app/notes/page.tsx`
  - [ ] Import and render `OntologyAnalysisButton`
  - [ ] Position button appropriately
  - [ ] Wire up refresh logic after extraction
- [ ] Test full flow: button → API → storage → UI refresh

### Phase 8: Testing
- [ ] Unit tests for prompt generation
- [ ] Unit tests for deduplication
- [ ] Integration test with mock OpenAI API
- [ ] Manual testing with sample notes
- [ ] Quality review of extracted ontology items
- [ ] Cost calculation ($0.10 per 20 notes target)

### Phase 9: Documentation
- [ ] Add environment variable to `.env.example`
- [ ] Update README with extraction feature
- [ ] Add troubleshooting guide
- [ ] Document expected costs

---

## Dev Notes

### Technical Decisions
- **localStorage for MVP**: Simpler than Supabase integration, can migrate later
- **No approval workflow**: Auto-accept high-confidence extractions for MVP
- **20 note limit**: Control costs and processing time
- **GPT-5-mini**: Cost-efficient model for extraction task

### API Structure
```typescript
POST /api/extract-ontology
Body: {
  userId: string,
  notes: Note[]  // Pass from client for MVP
}

Response: {
  success: boolean,
  counts: { values: number, beliefs: number, aims: number },
  error?: string
}
```

### Expected Output Format
```json
{
  "values": [
    {
      "text": "Compassion",
      "confidence": "high",
      "sourceNoteIds": ["note-1", "note-5"],
      "reasoning": "Recurring theme about empowering others"
    }
  ],
  "beliefs": [...],
  "aims": [...]
}
```

---

## Testing

### Manual Test Plan
1. Navigate to `/notes`
2. Click "Analyze My Notes" button
3. Verify loading state appears
4. Wait for completion (5-10 seconds)
5. Verify success toast with counts
6. Refresh page
7. Check Values/Beliefs/Aims cards populated
8. Review quality of extractions

### Expected Results (with 20 sample notes)
- Values: 5-8 items (e.g., "Compassion", "Integrity", "Presence")
- Beliefs: 5-10 items (e.g., "Meaning over happiness")
- Aims: 3-5 items (e.g., "Balance ambition with presence")

### Quality Criteria
- Extractions reflect actual note themes
- No misclassifications
- High-confidence items only
- No duplicates

---

## Dev Agent Record

### Agent Model Used
- Implementation: [To be filled]
- Review: [To be filled]

### Debug Log References
- [To be filled during implementation]

### Completion Notes
- [To be filled on completion]

### File List
```
[To be filled during implementation]
```

### Change Log
- [To be filled during implementation]

---

## References

- **Implementation Guide**: `/docs/story-2.4-updated.md`
- **GPT-5-mini API**: `/docs/openai-gpt5-api.md`
- **Sample Notes**: `/scripts/seed-ontology-notes.js`
- **PRD**: `/docs/prd.md` (Story 2.4 section)
