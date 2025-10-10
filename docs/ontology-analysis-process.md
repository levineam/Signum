# Personal Ontology Analysis Process

**Document Purpose**: Detailed explanation of how "Analyze My Notes" works in Signum
**Last Updated**: 2025-10-10
**Related Stories**: Story 2.4.3 (AI Personal Ontology Extraction)

---

## Overview

When a user clicks "Analyze My Notes", the system uses GPT-5-mini to extract Values, Beliefs, and Aims from their journal entries and notes, then stores the results in the three pinned ontology cards.

---

## Current Process Flow

### 1. User Initiates Analysis

**Location**: `src/components/notes/OntologyAnalysisButton.tsx`

**What Happens**:
- User clicks "Analyze My Notes" button
- System checks if user is authenticated
- Button shows loading spinner: "Analyzing..."

### 2. Fetch and Filter Notes

**Code**: `OntologyAnalysisButton.tsx:36-44`

```typescript
// Fetch ALL notes from Supabase for this user
const allNotes = await getNotes(user.id)

// Filter OUT the ontology notes themselves
const notesToAnalyze = allNotes.filter(
  (note) =>
    note.noteType === 'custom' ||
    note.noteType === 'journal-entry' ||
    note.noteType === 'reflection'
)
```

**What's Included**:
- ✅ Journal entries (`noteType: 'journal-entry'`)
- ✅ Custom notes (`noteType: 'custom'`)
- ✅ Reflection notes (`noteType: 'reflection'`)

**What's Excluded**:
- ❌ Values card (`noteType: 'ontology-value'`)
- ❌ Beliefs card (`noteType: 'ontology-belief'`)
- ❌ Aims card (`noteType: 'ontology-aim'`)

**Why Filter?** We don't want the AI to analyze its own previous outputs - only the user's original thoughts.

**Validation**: Requires minimum 5 notes (hard stop if fewer)

### 3. Send Notes to API

**Code**: `OntologyAnalysisButton.tsx:56-64`

```typescript
const response = await fetch('/api/extract-ontology', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: notesToAnalyze  // ALL filtered notes sent
  })
})
```

**Cost Control**: API route limits to first 20 notes (`route.ts:70`)

### 4. Build Prompt for GPT-5-mini

**Location**: `src/utils/ontologyPrompts.ts:buildExtractionPrompt()`

**Prompt Structure**:

```
You are an expert at analyzing personal journal entries...

Your task is to identify:
1. **Values**: Guiding principles (e.g., "Compassion", "Integrity")
2. **Beliefs**: Deeply held truths (e.g., "People have inherent wisdom")
3. **Aims**: Personal goals (e.g., "Build authentic relationships")

IMPORTANT GUIDELINES:
- Extract only HIGH-CONFIDENCE items
- Keep text SHORT and MEMORABLE (2-5 words)
- Provide up to 5 representative excerpts per item
- Each excerpt: 1-2 sentences from actual notes
- Include exact quotes with noteId and noteTitle
- Look for recurring themes
- Distinguish values vs beliefs vs aims

NOTES TO ANALYZE:

[Note 1 - ID: abc123]
Title: Journal Entry - Oct 15
Content: I've been thinking about compassion...
---

[Note 2 - ID: def456]
Title: Reflection on Sarah
Content: Real compassion requires listening...
---

[... up to 20 notes ...]

RESPONSE FORMAT: Return raw JSON (no markdown code blocks)

{
  "values": [
    {
      "text": "Compassion",
      "confidence": "high",
      "sourceExcerpts": [
        {
          "noteId": "abc123",
          "noteTitle": "Journal Entry - Oct 15",
          "excerpt": "Sometimes the most valuable conversations are..."
        }
      ]
    }
  ],
  "beliefs": [...],
  "aims": [...]
}

Only include items with "high" confidence.
```

**Key Prompt Features**:
- Requests SHORT, memorable phrases (2-5 words)
- Asks for EVIDENCE (excerpts from actual notes)
- Requires CONFIDENCE scoring (high/medium/low)
- Filters to only "high" confidence items
- Asks AI to DISTINGUISH between values, beliefs, and aims

### 5. Call OpenAI GPT-5-mini

**Location**: `src/app/api/extract-ontology/route.ts:76-82`

```typescript
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: prompt,
  reasoning: {
    effort: 'medium'  // Balanced for philosophical analysis
  }
})
```

**API Used**: OpenAI Responses API (not Chat Completions)
**Model**: `gpt-5-mini` (cost-effective, released August 2025)
**Reasoning Effort**: `medium` (balances quality with speed)

**What GPT-5-mini Does**:
1. Reads all note titles and content
2. Identifies recurring themes and patterns
3. Categorizes concepts as values/beliefs/aims
4. Extracts representative quotes
5. Assigns confidence scores
6. Returns structured JSON

### 6. Parse AI Response

**Location**: `src/utils/ontologyPrompts.ts:parseExtractionResult()`

**Challenges**:
- GPT-5-mini sometimes wraps JSON in markdown code blocks despite instructions
- Response may be split into multiple chunks

**Parsing Strategy**:
1. Extract text from `response.output_text` (may be empty)
2. If empty, concatenate all chunks from `response.output.message.content`
3. Strip markdown code blocks: ` ```json ... ``` `
4. Parse as JSON
5. Validate structure (has `values`, `beliefs`, `aims` arrays)
6. Validate each item has `sourceExcerpts` with `noteId`, `noteTitle`, `excerpt`
7. Filter to only `"confidence": "high"` items

**Response Format**:
```json
{
  "values": [
    {
      "text": "Compassion",
      "confidence": "high",
      "sourceExcerpts": [
        {
          "noteId": "abc123",
          "noteTitle": "Journal Entry - Oct 15",
          "excerpt": "Real compassion requires listening..."
        },
        {
          "noteId": "def456",
          "noteTitle": "Reflection on Sarah",
          "excerpt": "Just being present for each other matters."
        }
      ]
    },
    {
      "text": "Integrity",
      "confidence": "high",
      "sourceExcerpts": [...]
    }
  ],
  "beliefs": [
    {
      "text": "People have inherent wisdom",
      "confidence": "high",
      "sourceExcerpts": [...]
    }
  ],
  "aims": [
    {
      "text": "Balance ambition with presence",
      "confidence": "high",
      "sourceExcerpts": [...]
    }
  ]
}
```

### 7. Store Results in Ontology Cards

**Location**: `OntologyAnalysisButton.tsx:77-125`

**Process**:
1. Fetch the 3 pinned ontology notes from Supabase
2. Find each card by `noteType`:
   - `ontology-value` → Values card
   - `ontology-belief` → Beliefs card
   - `ontology-aim` → Aims card
3. Update each card's metadata with extracted items:

```typescript
await updateNote(valuesNote.id, {
  content: '',  // Keep empty - data is in metadata
  metadata: {
    items: extraction.values.map(v => ({
      name: v.text,
      confidence: v.confidence,
      excerpts: v.sourceExcerpts
    }))
  }
}, user.id)
```

**Storage Strategy**:
- `content` field: Empty (not used)
- `metadata` field: JSONB containing structured data
- Always overwrites previous analysis (not additive)

### 8. Show Success Message

**Code**: `OntologyAnalysisButton.tsx:128-131`

```typescript
toast.success('Ontology updated!', {
  description: `Analyzed ${notesToAnalyze.length} entries. Found ${counts.values} values, ${counts.beliefs} beliefs, ${counts.aims} aims`
})
```

**Example**: "Analyzed 15 entries. Found 3 values, 2 beliefs, 4 aims"

### 9. Refresh UI

Triggers `onComplete()` callback to refresh the ontology cards display.

---

## Key Decisions & Limitations

### What We Do

✅ **Analyze**: Journal entries, custom notes, reflections
✅ **Exclude**: Previous ontology extractions (avoid AI analyzing itself)
✅ **Limit**: First 20 notes (cost control)
✅ **Filter**: Only "high" confidence items
✅ **Validate**: Require evidence (excerpts) for each item
✅ **Store**: Structured metadata with source tracking

### What We Don't Do

❌ **No incremental analysis**: Re-analyzes ALL notes every time (not just new ones)
❌ **No user review**: Direct population of cards (no approval workflow)
❌ **No reasoning display**: User doesn't see AI's thought process
❌ **No progress updates**: Single loading spinner, no step-by-step feedback
❌ **No confidence thresholds**: Hard-coded to "high" only
❌ **No customization**: Can't adjust prompt or parameters

---

## Current UX Issues

### 1. **Opacity of Process**

**Problem**: User sees:
- Button click
- "Analyzing..." spinner
- Success toast

**Missing**:
- How many notes are being analyzed
- What the AI is looking for
- How it's making decisions
- What excerpts it's considering
- Why certain items were chosen

**User Impact**: Feels like a "black box" - hard to trust or understand results

### 2. **No Evidence Display**

**Problem**: Ontology cards show extracted items but not the supporting excerpts

**Missing**:
- Which journal entries support this value?
- What exact quotes led to this belief?
- Can I trace this back to my writing?

**User Impact**: Can't verify or learn from AI's reasoning

### 3. **All-or-Nothing Analysis**

**Problem**: Re-analyzes ALL notes every time (even when only 1-2 new entries)

**User Impact**:
- Slow for large journals (analyzing 20 notes takes 5-10 seconds)
- Expensive (costs add up with repeated full analyses)
- Results may shift dramatically between runs

### 4. **No Control or Customization**

**Problem**: User can't:
- Adjust confidence threshold (locked to "high")
- Choose which notes to include/exclude
- See or modify the prompt
- Control how many notes to analyze

**User Impact**: One-size-fits-all approach may not fit everyone's journaling style

---

## Recommendations for Transparency

### 1. **Progress Indicator (Like Perplexity/ChatGPT)**

Show step-by-step process:

```
[Step 1/4] Fetching your notes... ✓ Found 15 journal entries
[Step 2/4] Sending to AI for analysis... ✓ Analyzing with GPT-5-mini
[Step 3/4] Extracting values, beliefs, and aims...
[Step 4/4] Updating your ontology cards... ✓ Complete!
```

**Implementation**: Use a stepper component or expanding list

### 2. **Reasoning Display**

Show AI's thought process (similar to ChatGPT's reasoning mode):

```
💭 AI Reasoning (Expandable)
─────────────────────────────
Analyzing 15 notes for recurring themes...

Found "Compassion" mentioned in 4 entries:
- "Journal Entry - Oct 15": "Sometimes the most valuable..."
- "Reflection on Sarah": "Just being present matters..."
- "Morning Pages": "Real compassion requires listening..."
- "Evening Reflection": "Witnessing without fixing..."

Confidence: HIGH (appears 4x, explicitly stated)
Category: VALUE (guiding principle, not a goal or belief)
```

**Implementation**: Display GPT-5-mini's reasoning output (available in API response)

### 3. **Evidence Panel in Ontology Cards**

Click on "Compassion" to see:

```
📖 Evidence for "Compassion"
─────────────────────────────
Confidence: HIGH

Supporting Excerpts (4 found):

1. Journal Entry - Oct 15, 2025
   "Sometimes the most valuable conversations are the ones
   where you just witness each other's experience without
   trying to fix anything."
   [View Full Entry]

2. Reflection on Sarah
   "It's comforting to know that someone else is also
   figuring things out. Just being present for each other."
   [View Full Entry]

...
```

**Implementation**: Expandable sections in each ontology card

### 4. **Analysis Summary**

After completion, show:

```
📊 Analysis Summary
─────────────────────────────
Analyzed: 15 notes (12 journal entries, 3 reflections)
Timeframe: Sept 1 - Oct 10, 2025
Processing time: 8.2 seconds

Extracted:
✓ 3 Values (from 12 excerpts)
✓ 2 Beliefs (from 8 excerpts)
✓ 4 Aims (from 15 excerpts)

High-confidence items only. 7 medium-confidence items
were filtered out. [Show All]
```

### 5. **Note Selection Interface**

Before analysis, show:

```
📝 Select Notes to Analyze
─────────────────────────────
☑ All Journal Entries (12)
☑ All Reflections (3)
☐ Custom Notes (0)

Date Range: [Sept 1] to [Oct 10]

Total: 15 notes selected
Estimated time: ~8 seconds
```

---

## Technical Implementation Notes

### Data Flow

```
User Click
  ↓
Fetch Notes (Supabase)
  ↓
Filter (exclude ontology notes)
  ↓
POST /api/extract-ontology
  ↓
Build Prompt (format notes as text)
  ↓
OpenAI Responses API (GPT-5-mini)
  ↓
Parse JSON Response
  ↓
Validate & Filter (high confidence only)
  ↓
Update Ontology Cards (metadata field)
  ↓
Show Success Toast
  ↓
Refresh UI
```

### Error Handling

**Client-side** (`OntologyAnalysisButton.tsx`):
- Not authenticated → Error toast
- < 5 notes → Error toast with guidance
- API error → Display error message from server

**Server-side** (`route.ts`):
- No OpenAI API key → 500 error
- Invalid request → 400 error
- < 5 notes → 400 error
- OpenAI failure → 500 error with details
- Parse failure → 500 error

### Cost Considerations

**Per Analysis**:
- Model: GPT-5-mini (cheapest reasoning model)
- Input: ~20 notes × ~500 words = ~10,000 tokens
- Output: ~2,000 tokens (JSON response)
- Cost: ~$0.01-0.02 per analysis (estimated)

**Optimization Opportunities**:
- Incremental analysis (only new notes) → 80% cost reduction
- Note summarization before sending → 50% token reduction
- Cache previous results → No cost for unchanged data

---

## Files Reference

### Core Implementation

- **`src/components/notes/OntologyAnalysisButton.tsx`** - UI button and orchestration
- **`src/app/api/extract-ontology/route.ts`** - API endpoint
- **`src/utils/ontologyPrompts.ts`** - Prompt engineering and parsing
- **`src/lib/notes.ts`** - Supabase CRUD operations

### Data Schema

```typescript
// Note metadata structure for ontology cards
metadata: {
  items: Array<{
    name: string            // "Compassion"
    confidence: string      // "high"
    excerpts: Array<{
      noteId: string       // UUID of source note
      noteTitle: string    // "Journal Entry - Oct 15"
      excerpt: string      // "Real compassion requires..."
    }>
  }>
}
```

---

## Next Steps for Story 2.4.4

**Incremental Analysis** would address:
- Performance (only analyze new notes)
- Cost (fewer API calls)
- User experience (automatic, background processing)

**Proposed Flow**:
1. Track `lastAnalyzedAt` timestamp
2. On new journal entry creation, check if >= 5 new notes since last analysis
3. If yes, trigger background analysis of only new notes
4. Merge results with existing ontology (additive, not replacement)
5. Show subtle notification: "Ontology updated with insights from 3 new entries"
