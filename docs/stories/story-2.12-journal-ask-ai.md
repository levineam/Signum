# Story 2.12: Ask AI from Journal Text Selection

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-11-08
**Updated:** 2025-11-08
**Issue:** #162
**Parent Epic:** Phase 2: AI-Powered Features
**Prerequisites:**
- Story 2.5 (Voice Transcription) ✅ Complete - Establishes text selection toolbar pattern
- "Make Note" feature ✅ Complete - Text selection UX pattern established
- SimpleRichEditor infrastructure ✅ Complete

**Related Work:**
- PR #141 (Task-Based Ask AI) - Closed, serves as reference implementation
- Provides reusable patterns: OpenAI integration, note creation, error handling

---

## Story

As a user journaling in Signum,
I want to highlight text in my journal entry and ask AI questions about it,
so that I can explore ideas, get clarification, or deepen my understanding without leaving the journaling flow.

---

## Why This Matters

**Current State:**
- Users can highlight text and create linked notes via "Make Note" button
- No way to get AI assistance on journal content without copying text elsewhere
- Task-based "Ask AI" was in development but paused due to upcoming task system revamp

**Problems:**
- **Context switching**: Users must leave Signum to ask questions about their journal content
- **Lost flow**: Breaking the journaling flow to seek external AI help disrupts reflection
- **Missed insights**: Users may not explore ideas deeply without easy access to AI assistance
- **Inconsistent UX**: Similar text selection actions (Make Note vs Ask AI) should be co-located

**Benefits:**
- **Seamless exploration**: Ask questions about journal content without context switching
- **Deeper reflection**: AI can help users explore their thoughts more deeply
- **Knowledge capture**: AI answers stored as linked notes for future reference
- **Consistent UX**: Follows established "Make Note" pattern users already know

---

## Scope

### In Scope

**Core Feature:**
1. **Text Selection Trigger**
   - User highlights text in journal entry → "Make Note" + "Ask AI" buttons appear in toolbar
   - "Ask AI" button appears next to existing "Make Note" button
   - Icon: Sparkles (✨) matching existing AI feature patterns
   - Button label: "Ask AI"

2. **Query Refinement Dialog**
   - Modal opens when "Ask AI" clicked
   - Shows selected text as readonly context (styled box with subtle background)
   - Input field pre-filled with selected text as initial query
   - User can edit/refine query before submission
   - Character limit: 500 characters for query
   - "Generate Answer" button (disabled if empty, shows loading state during API call)
   - "Cancel" button to close dialog without action

3. **AI Answer Generation**
   - Calls `/api/ai/answer` endpoint (enhanced to support journal sources)
   - Uses OpenAI GPT-4o-mini for cost efficiency
   - Generates 200-1000 word answers with markdown formatting
   - **Critical:** Converts markdown → HTML before storing (fixes PR #141 rendering issue)
   - Timeout: 20 seconds (edge runtime)
   - Rate limiting: Existing patterns from PR #141

4. **Note Creation & Display**
   - Creates note with AI answer as content
   - Note title: First 100 chars of query (truncated with "..." if longer)
   - Note type: `custom`
   - Metadata includes:
     - `sourceType: 'journal'`
     - `journalEntryId: <entry_id>`
     - `selectedText: <original_text>`
     - `query: <final_query>`
     - `tokensUsed: <number>`
     - `model: 'gpt-4o-mini'`
     - `generatedAt: <timestamp>`
   - Success: Opens note in NoteViewer modal
   - Toast notification: "AI answer created! Opening note..."

5. **Error Handling**
   - Network errors: "Unable to generate answer. Please try again."
   - Rate limiting (429): "Daily AI limit reached. Try again tomorrow."
   - Timeout: "Request timeout - AI took too long to respond"
   - Auth errors: "Please sign in to use AI features"
   - Generic errors: User-friendly messages with details in dev/preview
   - All errors show toast notifications

**Technical Implementation:**

**New Component:** `/src/components/journal/AskAIDialog.tsx`
```typescript
interface AskAIDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  entryId: string
  onAnswerCreated?: (noteId: string) => void
}
```

**Modified Component:** `/src/components/editor/SimpleRichEditor.tsx`
- Add "Ask AI" button next to "Make Note" button (lines 1123-1143)
- Manage dialog open/close state
- Pass selected text and entry ID to dialog

**Enhanced API:** `/src/app/api/ai/answer/route.ts`
- Make `taskId` optional
- Add `sourceType` field ('task' | 'journal')
- Add `entryId` field for journal sources
- Skip task validation when `sourceType === 'journal'`
- Update note metadata to include source context
- **Critical fix:** Add markdown → HTML conversion using `remark` + `remark-html`

**Shared Utilities** (extract from PR #141):
- `/src/lib/ai/openai-client.ts` - OpenAI configuration, rate limiting
- `/src/lib/ai/prompt-templates.ts` - System prompts (task vs journal)
- `/src/lib/ai/markdown-to-html.ts` - Markdown conversion utility
- `/src/lib/ai/types.ts` - Shared AI response types

### Out of Scope

- Streaming responses (future enhancement)
- Multiple follow-up questions in dialog (single query only)
- History of previous AI interactions
- AI suggestions or auto-completion
- Custom model selection (always uses gpt-4o-mini)
- Batch processing multiple selections
- Voice input for queries
- Editing AI answers inline (must open note to edit)
- Task-based "Ask AI" (paused pending task system revamp)

---

## Acceptance Criteria

**AC1: Text Selection & Button Visibility**
- [ ] When user highlights text in journal entry, "Ask AI" button appears in toolbar
- [ ] "Ask AI" button appears next to "Make Note" button
- [ ] Button has sparkles icon (✨) and "Ask AI" label
- [ ] Button ONLY appears when text is selected (hidden when no selection)
- [ ] Button works on mobile, tablet, and desktop
- [ ] Behavior consistent with "Make Note" button (same visibility rules)

**AC2: Query Refinement Dialog**
- [ ] Clicking "Ask AI" opens modal dialog
- [ ] Dialog shows selected text as readonly context (styled box, max 200 chars preview with "..." if longer)
- [ ] Input field is pre-filled with selected text (truncated to 500 chars if longer)
- [ ] If selected text >500 chars, show warning: "Selection truncated to 500 characters. Edit as needed."
- [ ] User can edit query before submitting
- [ ] Character limit enforced (500 chars) with live counter (e.g., "485/500")
- [ ] Counter turns red when approaching limit (>480 chars)
- [ ] "Generate Answer" button disabled when query empty or >500 chars
- [ ] "Cancel" button closes dialog without action
- [ ] ESC key closes dialog

**AC3: AI Answer Generation**
- [ ] "Generate Answer" button shows loading state (spinner + "Generating..." text)
- [ ] API call made to `/api/ai/answer` with query
- [ ] Loading state disables all form inputs
- [ ] Network errors show user-friendly toast notifications
- [ ] Rate limit errors show specific message
- [ ] Timeout errors show appropriate message

**AC4: Note Creation & Display**
- [ ] Successful AI response creates note with answer as content
- [ ] Note title is first 100 chars of query (truncated with "...")
- [ ] Note metadata includes source context (journal, entry ID, selected text, query)
- [ ] **Critical:** AI markdown is converted to HTML before storage
- [ ] Note opens in NoteViewer modal after creation
- [ ] Toast notification: "AI answer created! Opening note..."

**AC5: Markdown Rendering Fix**
- [ ] AI answers with markdown formatting (bold, lists, headings) render as HTML, not raw markdown
- [ ] Headers (h1, h2) display with correct styling
- [ ] Bold text (**bold**) renders as `<strong>` tags
- [ ] Bullet lists render as proper `<ul>/<li>` elements
- [ ] Blockquotes render with proper indentation
- [ ] All rendered HTML passes through sanitizeHtml() security filter

**AC6: Error Handling & Edge Cases**
- [ ] Auth required: Show "Please sign in to use AI features"
- [ ] Query >500 chars: "Generate Answer" button disabled, counter shows red
- [ ] Selected text >500 chars: Auto-truncate with warning message
- [ ] Dialog closed during generation: Request completes in background, note created but not opened (acceptable MVP limitation)
- [ ] Network offline: Show appropriate offline error
- [ ] Malformed markdown from API: Conversion error caught, fallback to plain text with warning logged

---

## Design Decisions (Codex Review Findings)

**Issue 1: Button Visibility Contradiction (Blocking)**
- **Finding:** AC1 stated button "only appears when text is selected," but AC6 required "Selected text empty: Button appears but dialog shows error"
- **Resolution:** Button ONLY appears when text is selected (hidden otherwise)
- **Rationale:** Consistent with "Make Note" button UX pattern, prevents confusing empty-state interactions

**Issue 2: >500 Character Selections (Major)**
- **Finding:** No guidance on handling selections longer than 500-character query limit
- **Resolution:** Auto-truncate to 500 chars with visible warning message
- **Rationale:** Don't block user flow, but clearly communicate the limitation. User can edit truncated query before submission.
- **Implementation:** Dialog shows: "Selection truncated to 500 characters. Edit as needed." when `selectedText.length > 500`

**Issue 3: Cancellation During Generation (Minor/Major)**
- **Finding:** AC6 required "API call cancelled" when dialog closed, but serverless functions typically run to completion
- **Resolution:** Request completes in background, note created but not opened (acceptable MVP limitation)
- **Rationale:** Implementing true cancellation would require:
  - AbortController/AbortSignal on client
  - Job tracking system on server
  - Cooperative cancellation in edge runtime
  - Significantly increases complexity for edge case
- **Future Enhancement:** If this becomes a real UX issue, can add job tracking and cancellation in Phase 2

**Additional Clarifications:**
- Selected text preview in dialog capped at 200 chars (prevents dialog from being too tall)
- Character counter turns red at 480+ chars (clear visual feedback before limit)
- "Generate Answer" button disabled when query empty OR >500 chars (prevents invalid submissions)
- Markdown conversion errors fall back to plain text (logged for debugging, user sees content)

---

## Technical Design

### Component Architecture

```
SimpleRichEditor
├── [Text Selection Logic] (existing)
├── "Make Note" Button (existing)
└── "Ask AI" Button (NEW)
    └── Opens AskAIDialog

AskAIDialog (NEW)
├── Selected Text Display (readonly, max 200 chars preview)
├── Truncation Warning (if selected text >500 chars)
├── Query Input Field (editable, max 500 chars)
├── Character Counter (live, turns red >480 chars)
├── "Generate Answer" Button (disabled if empty or >500 chars)
│   └── Calls /api/ai/answer
│       └── Creates Note
│           └── Opens NoteViewer (if dialog still open)
└── "Cancel" Button
```

### API Architecture

```
POST /api/ai/answer
├── Input:
│   ├── taskId?: string (optional - for task sources)
│   ├── entryId?: string (optional - for journal sources)
│   ├── sourceType: 'task' | 'journal'
│   ├── query: string (user's refined question)
│   └── selectedText?: string (original context)
├── Process:
│   ├── Auth check (RLS-enforced)
│   ├── Validate input
│   ├── Call OpenAI API
│   ├── Convert markdown → HTML (NEW - fixes rendering issue)
│   └── Create note with metadata
└── Output:
    ├── answer: string (HTML content)
    ├── noteId: string
    ├── tokensUsed: number
    └── model: string
```

### Markdown → HTML Conversion

**New Utility:** `/src/lib/ai/markdown-to-html.ts`
```typescript
import { remark } from 'remark'
import html from 'remark-html'

export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(html, { sanitize: false }) // We sanitize separately with DOMPurify
    .process(markdown)

  return String(result)
}
```

**Why this approach?**
- Consistent with existing journal content (stored as HTML)
- No changes needed to NoteViewer rendering logic
- Reuses existing sanitizeHtml() security infrastructure
- Works immediately with `.prose` styling in globals.css

**Error Handling:**
```typescript
export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark()
      .use(html, { sanitize: false })
      .process(markdown)
    return String(result)
  } catch (error) {
    console.error('[Markdown Conversion] Failed:', error)
    // Fallback: return original text wrapped in paragraph
    return `<p>${markdown}</p>`
  }
}
```

### System Prompt for Journal Queries

**New Prompt:** `/src/lib/ai/prompt-templates.ts`
```typescript
export const JOURNAL_QUERY_SYSTEM_PROMPT = `You are a thoughtful assistant helping users explore their journal reflections.

Context: The user highlighted text in their journal and asked you a question about it.

Guidelines:
- Provide insightful, supportive answers that deepen self-reflection
- Use concise responses (200-500 words for simple questions, up to 1000 for complex)
- Use markdown formatting (headings, lists, bold, italics) for clarity
- Be conversational but thoughtful
- Acknowledge the personal nature of journal content with appropriate tone
- If the selected text provides context, reference it naturally
- Avoid speculation - if you don't have enough context, say so

Format your response using markdown:
- Use **bold** for key insights
- Use bullet points or numbered lists for clarity
- Use headings (##) to organize longer answers
- Use > blockquotes for reflective prompts when appropriate

Example:
User's journal text: "I've been feeling overwhelmed at work lately"
User's question: "What are some evidence-based strategies for managing work overwhelm?"

Your answer:
## Managing Work Overwhelm: Evidence-Based Strategies

Based on your reflection about feeling overwhelmed, here are some research-backed approaches:

**Cognitive Offloading:**
- Write down all tasks and worries to free up working memory
- Studies show this reduces intrusive thoughts by 40-50%

**Priority Focus:**
- Identify the single most important task each day
- Implementation intentions increase goal achievement (d=0.65)

**Time Blocking:**
- Schedule specific times for focused work
- Add 50% time buffers to prevent deadline stress

Remember: Feeling overwhelmed is a signal to reassess your boundaries and priorities.`
```

---

## Tasks / Subtasks

- [x] **Task 1: Extract Shared AI Utilities** (AC: All - Foundation)
  - [x] Create `/src/lib/ai/` directory structure
  - [x] Extract OpenAI client config from PR #141 reference
  - [x] Create `prompt-templates.ts` with JOURNAL_QUERY_SYSTEM_PROMPT
  - [x] Create `markdown-to-html.ts` utility with remark integration
  - [x] Create `types.ts` with shared AI response interfaces
  - [x] Add `remark` and `remark-html` to package.json dependencies
  - [x] Test markdown → HTML conversion with sample content

- [x] **Task 2: Enhance API Endpoint** (AC2, AC3, AC5)
  - [x] Modify `/api/ai/answer/route.ts` to accept `sourceType` and `entryId`
  - [x] Make `taskId` optional in validation
  - [x] Skip task validation when `sourceType === 'journal'`
  - [x] Integrate markdown → HTML conversion before note storage
  - [x] Update note metadata to include journal source context
  - [x] Test with sample markdown responses
  - [x] Verify HTML output passes sanitizeHtml() without stripping content
  - [x] Test error handling for malformed markdown

- [x] **Task 3: Create AskAIDialog Component** (AC2, AC3, AC4, AC6)
  - [x] Create `/src/components/journal/AskAIDialog.tsx`
  - [x] Implement modal with shadcn Dialog component
  - [x] Add selected text display (readonly, styled box, max 200 chars with "...")
  - [x] Implement truncation logic: If `selectedText.length > 500`, truncate and show warning
  - [x] Add warning message component: "Selection truncated to 500 characters. Edit as needed."
  - [x] Add query input field (editable, pre-filled with truncated selected text if >500 chars)
  - [x] Add live character counter (e.g., "485/500")
  - [x] Character counter turns red when >480 chars
  - [x] Implement "Generate Answer" button with state management (idle/loading/success/error)
  - [x] Button disabled when query empty OR >500 chars
  - [x] Implement "Cancel" button
  - [x] Add ESC key handler to close dialog
  - [x] Integrate API call to `/api/ai/answer`
  - [x] Handle success: Open NoteViewer with new note (only if dialog still open)
  - [x] Handle errors: Show toast notifications
  - [x] Add loading spinner and "Generating..." text during API call
  - [x] Disable all inputs during loading
  - [x] Document that closing dialog during generation allows background completion (MVP limitation)

- [x] **Task 4: Modify SimpleRichEditor** (AC1)
  - [x] Add "Ask AI" button next to "Make Note" button (lines 1123-1143)
  - [x] Import Sparkles icon from lucide-react
  - [x] Add dialog state management (isAskAIDialogOpen)
  - [x] Pass selected text to dialog
  - [x] Pass entry ID to dialog (new prop needed: add `entryId?: string` to SimpleRichEditorProps)
  - [x] Handle note created callback (open NoteViewer)
  - [x] Ensure button ONLY appears when text is selected (hidden otherwise, same as "Make Note")
  - [x] Test button visibility on text selection
  - [x] Test responsive layout (mobile, tablet, desktop)

- [ ] **Task 5: Testing & Edge Cases** (AC6)
  - [ ] Test auth required scenario (not logged in)
  - [ ] Test query validation (empty query → button disabled)
  - [ ] Test query validation (>500 chars → button disabled, counter red)
  - [ ] Test selected text >500 chars (auto-truncate, warning shown)
  - [ ] Test selected text edge cases (very short, emoji-heavy, special characters)
  - [ ] Test dialog close during generation (verify note created in background, not opened)
  - [ ] Test network offline scenario
  - [ ] Test rate limiting (mock 429 response)
  - [ ] Test timeout scenario (mock slow API)
  - [ ] Test markdown rendering in created notes (verify bold, lists, headers work)
  - [ ] Test HTML sanitization (verify no XSS vulnerabilities)
  - [ ] Test malformed markdown conversion (verify fallback to plain text)

- [ ] **Task 6: PR Preparation** (All AC)
  - [ ] Update CLAUDE.md if needed with new patterns
  - [ ] Verify all acceptance criteria met
  - [ ] Run `npm run build` and fix any TypeScript errors
  - [ ] Test locally on dev server
  - [ ] Create GitHub issue for this story
  - [ ] Create PR with comprehensive description
  - [ ] Add screenshots/video of feature in action
  - [ ] Ensure Codex review is requested
  - [ ] Test on Vercel preview deployment

---

## Dev Notes

### Relevant Source Tree

**Components:**
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor with toolbar
  - Lines 1123-1143: "Make Note" button implementation (pattern to follow)
  - Lines 768-801: Text selection handling logic (reuse)
  - Props: Add `entryId` prop (needed for API call)

- `/src/components/notes/NoteViewer.tsx` - Note display modal
  - Lines 259-273: HTML rendering with sanitization (verifies our markdown → HTML approach works)

**API:**
- `/src/app/api/ai/answer/route.ts` - AI answer generation (from PR #141)
  - Lines 38-73: Auth and validation
  - Lines 124-150: OpenAI API call
  - Lines 151-183: Note creation logic
  - **Modify:** Lines 76-84 to support journal sources
  - **Add:** Markdown → HTML conversion after line 148

**Utilities:**
- `/src/utils/sanitizeHtml.ts` - HTML sanitization with DOMPurify
  - Lines 27-34: ALLOWED_TAGS (verify markdown tags are whitelisted)
  - Lines 49-77: Style filtering hook (verify markdown styles allowed)

**Database Schema:**
- `notes` table: `id`, `user_id`, `title`, `content`, `note_type`, `metadata`, `created_at`, `updated_at`
  - `content`: TEXT - will store HTML (not markdown)
  - `metadata`: JSONB - will include source context

### Architecture Context

**Journal Entry Flow:**
```
User types in journal → SimpleRichEditor
  → Text selection detected → Toolbar buttons appear
  → User clicks "Ask AI" → AskAIDialog opens
  → User refines query → Clicks "Generate Answer"
  → API call → OpenAI generates markdown
  → Markdown converted to HTML → Note created
  → NoteViewer opens → HTML rendered with sanitization
```

**Key Architectural Decisions:**

1. **Markdown → HTML Conversion at API Level** (not render time)
   - **Why:** Consistent with existing journal content storage
   - **How:** Use `remark` + `remark-html` libraries
   - **Benefit:** No changes to NoteViewer, reuses existing sanitization

2. **Reuse Existing `/api/ai/answer` Endpoint** (don't create new one)
   - **Why:** Same underlying logic (OpenAI call, note creation, error handling)
   - **How:** Add `sourceType` field to differentiate task vs journal
   - **Benefit:** Code reuse, consistent error handling

3. **Dialog Pattern vs Inline** (modal dialog, not inline in editor)
   - **Why:** Query refinement needs dedicated UI space
   - **How:** shadcn Dialog component (consistent with existing modals)
   - **Benefit:** Clear focus, less UI clutter

4. **Store AI Answer as Note** (not separate entity)
   - **Why:** Notes are first-class entities with full CRUD support
   - **How:** Use `metadata` JSONB field for source context
   - **Benefit:** Reuses existing note infrastructure, searchable, editable

### Critical Implementation Details

**Markdown → HTML Conversion:**
```typescript
// In /api/ai/answer/route.ts
import { convertMarkdownToHtml } from '@/lib/ai/markdown-to-html'

// After line 148 (after getting answer from OpenAI)
const htmlContent = await convertMarkdownToHtml(answer)

// Use htmlContent instead of answer when creating note
const { data: note } = await supabase
  .from('notes')
  .insert({
    content: htmlContent, // HTML, not markdown
    // ... rest of fields
  })
```

**SimpleRichEditor Entry ID Prop:**
```typescript
// Add to SimpleRichEditorProps interface (line 8)
entryId?: string

// Pass from JournalStream or wherever editor is used
<SimpleRichEditor
  entryId={currentEntry?.id}
  // ... other props
/>
```

**AskAIDialog Integration:**
```typescript
// In SimpleRichEditor.tsx, add state
const [showAskAI, setShowAskAI] = useState(false)

// In toolbar (after Make Note button)
{hasSelection && (
  <Button onClick={() => setShowAskAI(true)}>
    <Sparkles className="h-4 w-4" />
    Ask AI
  </Button>
)}

// Add dialog at end of component
<AskAIDialog
  isOpen={showAskAI}
  onClose={() => setShowAskAI(false)}
  selectedText={selectedText}
  entryId={entryId || ''}
  onAnswerCreated={(noteId) => {
    setShowAskAI(false)
    // Open NoteViewer with noteId
  }}
/>
```

### Reference Implementation (PR #141)

**What to reuse:**
- State management pattern from `AskAIButton` (idle/loading/success/error)
- API error handling and toast patterns
- OpenAI configuration (model, temperature, max_tokens)
- Note creation metadata structure
- Auth and validation patterns

**What to modify:**
- Make `taskId` optional, add `sourceType` and `entryId`
- Add markdown → HTML conversion
- Change system prompt for journal context
- Add query refinement UI (dialog vs immediate button click)

**What NOT to reuse:**
- Task-specific validation logic
- Query detection/classification logic
- Task card UI integration

### Testing Standards

**Test File Location:**
- Component tests: `/src/components/journal/__tests__/AskAIDialog.test.tsx`
- API tests: `/src/app/api/ai/__tests__/answer.test.ts`
- Utility tests: `/src/lib/ai/__tests__/markdown-to-html.test.ts`

**Testing Frameworks:**
- Vitest for unit tests
- Playwright for E2E tests (if time permits)
- Manual testing on Vercel preview (required)

**Test Coverage Required:**
- [ ] AskAIDialog: Rendering, user input, API call states
- [ ] API endpoint: Auth, validation, OpenAI call, note creation, markdown conversion
- [ ] Markdown utility: Basic markdown, complex markdown, edge cases
- [ ] SimpleRichEditor: Button visibility, dialog trigger
- [ ] Integration: End-to-end flow from text selection to note display

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-08 | 1.0 | Initial story creation | Claude (Sonnet 4.5) |
| 2025-11-08 | 1.1 | Fixed Codex review findings: AC1/AC6 contradiction, >500 char handling, cancellation behavior | Claude (Sonnet 4.5) |
| 2025-11-09 | 1.2 | Implemented shared AI utilities, journal Ask AI API/dialog/editor integration, and unified note validation | Codex (GPT-5) |

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used

- GPT-5 Codex via Conductor (BMad Master)

### Debug Log References

- `.ai/debug-log.md` (2025-11-09 entries for Story 2.12 – Ask AI integration)

### Completion Notes List

1. Added shared AI utility layer (`src/lib/ai/*`) and wired markdown→HTML conversion through the `/api/ai/answer` route.
2. Built `AskAIDialog` with truncation, validation, and toast-driven error handling, then embedded it into `SimpleRichEditor` with selection-aware controls.
3. Updated journal and note editors to surface the Ask AI button consistently and ensured new answers launch `NoteViewer`; production bug fixed by validating entry IDs against `notes.note_type='journal-entry'`.
4. `npm run lint` currently fails due to pre-existing CommonJS/unicorn rule issues; no new lint violations introduced.

### File List

- `package.json`, `package-lock.json` – Added remark dependencies for markdown conversion.
- `src/lib/ai/markdown-to-html.ts` – Markdown → HTML utility.
- `src/lib/ai/prompt-templates.ts`, `src/lib/ai/types.ts` – Shared AI prompts and typed contracts.
- `src/app/api/ai/answer/route.ts` – Journal-aware validation, markdown conversion, metadata updates, bugfix for unified notes table.
- `src/components/journal/AskAIDialog.tsx` – Query refinement modal + API wiring.
- `src/components/editor/SimpleRichEditor.tsx` – Ask AI button/state, selection plumbing.
- `src/components/journal/JournalStream.tsx`, `src/app/notes/[id]/page.tsx` – Pass new props and handle `onNoteCreated` from Ask AI answers.

---

## QA Results

*This section will be populated by QA agent after implementation.*
