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
- [ ] Button only appears when text is selected
- [ ] Button works on mobile, tablet, and desktop

**AC2: Query Refinement Dialog**
- [ ] Clicking "Ask AI" opens modal dialog
- [ ] Dialog shows selected text as readonly context (styled box)
- [ ] Input field is pre-filled with selected text
- [ ] User can edit query before submitting
- [ ] Character limit enforced (500 chars) with counter
- [ ] "Generate Answer" button disabled when query empty
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
- [ ] Query too long: Show validation error at 500 chars
- [ ] Selected text empty: Button appears but dialog shows error
- [ ] Dialog closed during generation: API call cancelled
- [ ] Network offline: Show appropriate offline error

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
├── Selected Text Display (readonly)
├── Query Input Field (editable)
├── Character Counter
├── "Generate Answer" Button
│   └── Calls /api/ai/answer
│       └── Creates Note
│           └── Opens NoteViewer
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

- [ ] **Task 1: Extract Shared AI Utilities** (AC: All - Foundation)
  - [ ] Create `/src/lib/ai/` directory structure
  - [ ] Extract OpenAI client config from PR #141 reference
  - [ ] Create `prompt-templates.ts` with JOURNAL_QUERY_SYSTEM_PROMPT
  - [ ] Create `markdown-to-html.ts` utility with remark integration
  - [ ] Create `types.ts` with shared AI response interfaces
  - [ ] Add `remark` and `remark-html` to package.json dependencies
  - [ ] Test markdown → HTML conversion with sample content

- [ ] **Task 2: Enhance API Endpoint** (AC2, AC3, AC5)
  - [ ] Modify `/api/ai/answer/route.ts` to accept `sourceType` and `entryId`
  - [ ] Make `taskId` optional in validation
  - [ ] Skip task validation when `sourceType === 'journal'`
  - [ ] Integrate markdown → HTML conversion before note storage
  - [ ] Update note metadata to include journal source context
  - [ ] Test with sample markdown responses
  - [ ] Verify HTML output passes sanitizeHtml() without stripping content
  - [ ] Test error handling for malformed markdown

- [ ] **Task 3: Create AskAIDialog Component** (AC2, AC3, AC4)
  - [ ] Create `/src/components/journal/AskAIDialog.tsx`
  - [ ] Implement modal with shadcn Dialog component
  - [ ] Add selected text display (readonly, styled box)
  - [ ] Add query input field (editable, pre-filled with selected text)
  - [ ] Add character counter (500 char limit with visual feedback)
  - [ ] Implement "Generate Answer" button with state management (idle/loading/success/error)
  - [ ] Implement "Cancel" button
  - [ ] Add ESC key handler to close dialog
  - [ ] Integrate API call to `/api/ai/answer`
  - [ ] Handle success: Open NoteViewer with new note
  - [ ] Handle errors: Show toast notifications
  - [ ] Add loading spinner and "Generating..." text during API call
  - [ ] Disable all inputs during loading

- [ ] **Task 4: Modify SimpleRichEditor** (AC1)
  - [ ] Add "Ask AI" button next to "Make Note" button (lines 1123-1143)
  - [ ] Import Sparkles icon from lucide-react
  - [ ] Add dialog state management (isAskAIDialogOpen)
  - [ ] Pass selected text to dialog
  - [ ] Pass entry ID to dialog (new prop needed)
  - [ ] Handle note created callback (open NoteViewer)
  - [ ] Test button visibility on text selection
  - [ ] Test responsive layout (mobile, tablet, desktop)

- [ ] **Task 5: Testing & Edge Cases** (AC6)
  - [ ] Test auth required scenario (not logged in)
  - [ ] Test query validation (empty, too long)
  - [ ] Test selected text edge cases (empty, very long)
  - [ ] Test dialog close during generation
  - [ ] Test network offline scenario
  - [ ] Test rate limiting (mock 429 response)
  - [ ] Test timeout scenario (mock slow API)
  - [ ] Test markdown rendering in created notes (verify bold, lists, headers work)
  - [ ] Test HTML sanitization (verify no XSS vulnerabilities)

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

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used

*TBD*

### Debug Log References

*TBD*

### Completion Notes List

*TBD*

### File List

*TBD*

---

## QA Results

*This section will be populated by QA agent after implementation.*
