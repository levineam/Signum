# Epic 2.14: YouTube Video Embedding & AI Summarization

**Epic ID**: 2.14
**Epic Type**: Brownfield Enhancement
**Parent Epic**: N/A
**Related Issue**: [#220 - Auto-embed YouTube videos with AI-generated summaries](https://github.com/levineam/Signum/issues/220)
**Status**: 📋 Ready for Implementation
**Estimated Duration**: 6-10 days
**Created**: December 8, 2025
**Decisions Finalized**: December 8, 2025

---

## Epic Goal

Enable users to embed YouTube videos in journal entries and notes, with the ability to generate AI summaries from video transcripts. This enhancement allows users to watch videos in-context and quickly understand video content through AI-generated summaries.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- **SimpleRichEditor** (`src/components/editor/SimpleRichEditor.tsx`): Rich text editor using contentEditable with execCommand APIs
- **Current Paste Behavior**: Strips HTML formatting, inserts plain text only (security measure)
- **HTML Sanitization** (`src/utils/sanitizeHtml.ts`): DOMPurify-based whitelist filtering
  - Current allowed tags: p, br, strong, em, u, s, b, i, h1-h6, ul, ol, li, a, span, div, blockquote, code, pre, mark
  - Does NOT currently allow `iframe` tags
- **AI Integration**: Existing Ask AI feature (`/api/ai/answer`) using OpenAI gpt-4o-mini
- **Note Storage**: Notes stored with HTML content, metadata as JSONB

**Technology Stack:**
- Next.js 15.5.3 (App Router, Turbopack) + React 19.1.0 + TypeScript ^5
- Tailwind CSS for styling
- shadcn/ui with Notebook theme
- OpenAI gpt-4o-mini for AI features
- Supabase for database and auth

**Integration Points:**
1. **SimpleRichEditor** - Paste handling, embed rendering
2. **sanitizeHtml.ts** - Allow YouTube iframes safely
3. **API Routes** - New routes for transcript and summarization
4. **Note Metadata** - Store video summary metadata
5. **CSS** - Styling for embeds in edit and read-only modes

### Enhancement Details

**What's Being Added:**

A YouTube video embedding and AI summarization system that provides:
- **URL Detection**: Automatically detect YouTube URLs when pasted
- **Video Embedding**: Render embedded YouTube player in journal/notes
- **Manual Summarization**: "Summarize Video" button triggers transcript extraction and AI summary
- **Linked Note Creation**: Summary stored as separate linked note (follows Ask AI pattern)
- **Secure Embedding**: Only allow iframes from trusted YouTube domains

**How It Integrates:**

1. **Visual Integration**: YouTube embeds appear inline in journal entries with consistent styling
2. **AI Integration**: Extends existing OpenAI infrastructure with video summarization capability
3. **Note Integration**: Summaries stored as linked notes with video metadata
4. **Security Integration**: Iframe allowlist in sanitizeHtml.ts restricts to YouTube domains only

**Design Decisions (Finalized):**

1. **Trigger mechanism**: **Manual** - User clicks "Summarize Video" button (no auto-summarization on paste)
   - Rationale: Saves tokens, gives user control over when to incur costs

2. **Summary storage**: **Linked Note** - Create separate note with summary, linked via metadata
   - Rationale: Follows existing "Ask AI" pattern, keeps summaries as standalone reference material

3. **Video duration limits**: **No limits** - Allow any length video
   - Rationale: Personal use only, user accepts token costs

---

## Success Criteria

1. ✅ YouTube URLs automatically detected and converted to embedded video players
2. ✅ "Summarize Video" button appears below embeds, triggers AI summarization on click
3. ✅ AI-generated summaries (2-3 paragraphs) created as linked notes
4. ✅ Video embeds work in both edit mode and read-only mode
5. ✅ Only YouTube domains allowed for iframe embeds (security)
6. ✅ Graceful degradation when transcripts unavailable (embed still works)
7. ✅ No breaking changes to existing journal/note content
8. ✅ Summary generation completes within reasonable time (depends on video length)

---

## Stories

This epic consists of 4 coordinated stories:

### Story 2.14.1: YouTube URL Detection & Embed Component (2-3 days)

**Goal**: Create YouTube URL detection utility and embed component with secure iframe handling.

**Scope**:
- Create `/src/utils/youtube.ts` - URL detection, video ID extraction
- Create `/src/components/media/YouTubeEmbed.tsx` - Embed component
- Update `/src/utils/sanitizeHtml.ts` - Add iframe to whitelist with YouTube domain filter
- Update `/src/app/globals.css` - Styling for embeds in `.rich-editor-body` and `.prose`

**Deliverables**:
- YouTube URL pattern matching utility
- Responsive embed component with 16:9 aspect ratio
- Secure iframe filtering in sanitizeHtml
- CSS for edit and read-only modes

**Dependencies**: None (can start immediately)

---

### Story 2.14.2: YouTube Transcript Extraction API (2-3 days)

**Goal**: Create API route to fetch YouTube video transcripts.

**Scope**:
- Add `youtube-transcript` npm package
- Create `/src/app/api/youtube/transcript/route.ts` - Transcript extraction endpoint
- Create `/src/lib/youtube/transcript.ts` - Transcript service wrapper
- Handle errors (private videos, no transcript available)

**Deliverables**:
- npm package installed
- API route returning transcript text
- Error handling for edge cases

**Dependencies**: Story 2.14.1 (URL utilities shared)

---

### Story 2.14.3: AI Video Summarization API (2-3 days)

**Goal**: Create API route to summarize video transcripts using OpenAI.

**Scope**:
- Create `/src/app/api/youtube/summarize/route.ts` - Summarization endpoint
- Add VIDEO_SUMMARY_SYSTEM_PROMPT to `/src/lib/ai/prompt-templates.ts`
- Create linked note with summary content and video metadata
- Convert markdown response to HTML

**Deliverables**:
- Summarization API route
- System prompt for video summaries
- Note creation with video metadata

**Dependencies**: Story 2.14.2 (uses transcript API internally)

---

### Story 2.14.4: Editor Integration & UX (2-3 days)

**Goal**: Integrate YouTube detection into SimpleRichEditor with user controls.

**Scope**:
- Modify handlePaste in SimpleRichEditor to detect YouTube URLs
- Insert embed component below pasted URL
- Add "Summarize Video" button to YouTubeEmbed component
- Handle loading states and error messages
- Update JournalStream for read-only rendering

**Deliverables**:
- Editor paste handling for YouTube URLs
- Manual summarization trigger
- Loading and error states
- Toast notifications for success/failure

**Dependencies**: Stories 2.14.1, 2.14.2, 2.14.3 (all must be complete)

---

## Compatibility Requirements

### Component Compatibility
- ✅ SimpleRichEditor maintains existing props API
- ✅ Existing paste behavior preserved for non-YouTube content
- ✅ No breaking changes to existing journal entries or notes

### Security Compatibility
- ✅ Iframe sources restricted to YouTube domains only
- ✅ All AI output sanitized through existing sanitizeHtml
- ✅ Video ID validation prevents injection attacks

### Performance Compatibility
- ✅ Embed loading is async, doesn't block editor
- ✅ Summary generation is manual, on-demand only
- ✅ Transcripts cached to avoid re-fetching

---

## Risk Mitigation

### Primary Risk: Transcript API Reliability

**Risk Description**: `youtube-transcript` package relies on undocumented YouTube APIs that could break.

**Likelihood**: Medium

**Impact**: Medium (feature degrades gracefully - embed works, summary doesn't)

**Mitigation**:
1. Feature gracefully degrades - embed always works even without transcript
2. Clear error message when transcript unavailable
3. Monitor for library updates
4. Consider YouTube Data API as backup (requires API key)

### Secondary Risk: Long Transcripts/Token Limits

**Risk Description**: Very long videos could exceed token limits or be expensive.

**Likelihood**: Low (personal use)

**Impact**: Low (user accepts costs)

**Mitigation**:
1. User confirmed no duration limits needed
2. Can add truncation with indicator if needed later
3. Monitor token usage

---

## Definition of Done

### Epic-Level DoD

- ✅ All 4 stories completed with acceptance criteria met
- ✅ YouTube URLs detected and embedded automatically
- ✅ "Summarize Video" button works and creates linked notes
- ✅ Embeds render correctly in edit and read-only modes
- ✅ Security: Only YouTube iframes allowed
- ✅ Error handling: Graceful degradation when transcripts unavailable
- ✅ No ESLint errors (`npm run lint`)
- ✅ Builds successfully (`npm run build`)
- ✅ PR created and tested on Vercel preview
- ✅ No regression in existing editor functionality

### Per-Story DoD

Each story must meet:
- ✅ All story acceptance criteria met
- ✅ Code follows project coding standards (TypeScript strict, 2-space indent)
- ✅ No ESLint errors
- ✅ Builds successfully
- ✅ Tested locally with `npm run dev:test`
- ✅ PR created with detailed description
- ✅ Tested on Vercel preview deployment
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Related Documentation

### Issue #220
- **Original Issue**: [#220](https://github.com/levineam/Signum/issues/220) - Feature request, technical approach

### Project Documentation
- **PRD**: `docs/prd.md` - Product requirements
- **CLAUDE.md**: `.claude/CLAUDE.md` - PR-based workflow, testing requirements

### Related Files
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor
- `/src/utils/sanitizeHtml.ts` - HTML sanitization
- `/src/app/api/ai/answer/route.ts` - Existing AI integration pattern
- `/src/lib/ai/prompt-templates.ts` - AI system prompts

---

## Notes

### Why This Epic vs Full PRD/Architecture?

This enhancement qualified for the brownfield epic process because:
- ✅ Can be completed in 4 focused stories
- ✅ No significant architectural changes (extends existing patterns)
- ✅ Integration complexity is manageable (leverages existing AI infrastructure)
- ✅ Risk to existing system is low (additive enhancement)

### Future Extensions

- Other video platforms (Vimeo, TikTok)
- Timestamp extraction for key moments
- User preference to enable/disable auto-embedding

---

**Epic Status**: 📋 **READY FOR IMPLEMENTATION**

**Next Action**: Begin Story 2.14.1 (URL Detection & Embed Component)
