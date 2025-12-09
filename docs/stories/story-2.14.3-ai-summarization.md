# Story 2.14.3: AI Video Summarization API

**Status:** 📋 Draft
**Created:** 2025-12-08
**Updated:** 2025-12-08
**Epic:** [Epic 2.14 - YouTube Video Embedding & AI Summarization](./epic-2.14-youtube-embed-summarization.md)
**Issue:** #220
**Estimated Duration:** 2-3 days
**Dependencies:** Story 2.14.2 (Transcript extraction API)

---

## Story

As a user who wants to understand a YouTube video quickly,
I want to generate an AI summary from the video transcript,
so that I can capture key insights without watching the entire video.

---

## Problem Statement

Users paste YouTube videos into their journals but may not have time to watch entire videos. By leveraging the extracted transcript, we can use OpenAI to generate concise summaries that capture the key points, allowing users to quickly understand video content.

---

## Proposed Solution

Create an API route that:
1. Fetches transcript via the transcript API (Story 2.14.2)
2. Sends transcript to OpenAI with a video summarization prompt
3. Converts markdown response to HTML
4. Creates a linked note with the summary
5. Returns note ID and summary preview

---

## Acceptance Criteria

**AC1: API Route**
- [ ] Route created at `/src/app/api/youtube/summarize/route.ts`
- [ ] Uses Edge runtime for longer timeout (25s)
- [ ] Requires authentication
- [ ] Validates video ID format
- [ ] Accepts optional entryId for linking to journal entry

**AC2: Transcript Integration**
- [ ] Fetches transcript internally via transcript service
- [ ] Handles transcript not available gracefully
- [ ] No video duration limits (per user decision)

**AC3: AI Summarization**
- [ ] Uses OpenAI gpt-4o-mini model
- [ ] Uses VIDEO_SUMMARY_SYSTEM_PROMPT
- [ ] Generates 200-400 word summary
- [ ] Extracts 3-5 key takeaways
- [ ] Converts markdown to HTML before storage

**AC4: Note Creation**
- [ ] Creates note with summary as content
- [ ] Note type: `custom`
- [ ] Title: "Summary: [Video Title or ID]"
- [ ] Metadata includes video context:
  - `sourceType: 'video'`
  - `videoId`
  - `videoUrl`
  - `journalEntryId` (if provided)
  - `tokensUsed`
  - `model`
  - `generatedAt`

**AC5: Response Format**
- [ ] Returns noteId of created summary note
- [ ] Returns summary HTML for preview
- [ ] Returns token usage
- [ ] Returns video title if available

**AC6: Error Handling**
- [ ] Returns 400 for invalid video ID
- [ ] Returns 401 for unauthenticated
- [ ] Returns 404 for transcript not available
- [ ] Returns 408 for timeout
- [ ] Returns 429 for rate limiting
- [ ] Returns 500 for AI generation failure

---

## Technical Design

### Files to Create

**1. `/src/app/api/youtube/summarize/route.ts`**
```typescript
export const runtime = 'edge';

interface SummarizeRequest {
  videoId: string;
  videoUrl?: string;
  entryId?: string;  // Optional: link to journal entry
}

interface SummarizeResponse {
  noteId: string;
  summary: string;  // HTML content
  tokensUsed: number;
  model: string;
  videoTitle?: string;
}
```

### Files to Modify

**1. `/src/lib/ai/prompt-templates.ts`**

Add new prompt:
```typescript
export const VIDEO_SUMMARY_SYSTEM_PROMPT = `You are a helpful assistant that summarizes YouTube videos based on their transcripts.

Guidelines:
- Provide a concise summary (200-400 words) of the main content
- Extract 3-5 key takeaways as bullet points
- Note any actionable insights or recommendations
- Maintain the original tone (educational, entertaining, etc.)
- If the transcript seems incomplete or unclear, note that

Format your response using markdown:

## Summary

[Main summary paragraph - what is this video about, what are the main points discussed]

## Key Takeaways

- **Point 1**: Brief explanation
- **Point 2**: Brief explanation
- **Point 3**: Brief explanation
[Up to 5 points]

## Notable Quotes or Insights

> Any particularly impactful quotes (if present in transcript)

Remember: Be concise but comprehensive. Users want to quickly understand the video's value.`;
```

**2. `/src/lib/ai/types.ts`**

Add new type:
```typescript
export interface VideoSummaryNoteMetadata {
  sourceType: 'video';
  videoId: string;
  videoUrl: string;
  journalEntryId?: string;
  tokensUsed: number;
  model: string;
  generatedAt: string;
}
```

### Request/Response Schema

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "entryId": "uuid-of-journal-entry"
}
```

**Success Response (200):**
```json
{
  "noteId": "uuid-of-created-note",
  "summary": "<h2>Summary</h2><p>This video discusses...</p>...",
  "tokensUsed": 1250,
  "model": "gpt-4o-mini",
  "videoTitle": "Never Gonna Give You Up"
}
```

**Error Response (404):**
```json
{
  "error": "Transcript not available for this video. Cannot generate summary.",
  "code": "TRANSCRIPT_NOT_FOUND"
}
```

---

## Tasks / Subtasks

- [ ] **Task 1: Add Video Summary Prompt**
  - [ ] Add VIDEO_SUMMARY_SYSTEM_PROMPT to prompt-templates.ts
  - [ ] Test prompt with sample transcript

- [ ] **Task 2: Add Video Metadata Types**
  - [ ] Add VideoSummaryNoteMetadata to types.ts
  - [ ] Ensure compatibility with existing note metadata

- [ ] **Task 3: Create Summarization API Route**
  - [ ] Create `/src/app/api/youtube/summarize/route.ts`
  - [ ] Add Edge runtime config
  - [ ] Implement auth check
  - [ ] Validate video ID
  - [ ] Fetch transcript via internal service
  - [ ] Call OpenAI API
  - [ ] Convert markdown to HTML
  - [ ] Create note with metadata
  - [ ] Return response

- [ ] **Task 4: Integration with Transcript API**
  - [ ] Import transcript service
  - [ ] Handle transcript not available
  - [ ] Pass full transcript to OpenAI

- [ ] **Task 5: Note Creation**
  - [ ] Create note using existing patterns
  - [ ] Set appropriate note type
  - [ ] Include all metadata fields
  - [ ] Handle encryption if enabled

- [ ] **Task 6: Error Handling**
  - [ ] Timeout handling (20s for OpenAI call)
  - [ ] Rate limiting response
  - [ ] Transcript not found handling
  - [ ] OpenAI failure handling
  - [ ] Add logging for debugging

- [ ] **Task 7: Testing**
  - [ ] Test with real video transcript
  - [ ] Test note creation
  - [ ] Test metadata storage
  - [ ] Test error scenarios
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`

---

## Dev Notes

### Relevant Source Tree

**Existing AI Integration:**
- `/src/app/api/ai/answer/route.ts` - Pattern to follow
  - Lines 124-150: OpenAI API call pattern
  - Lines 151-183: Note creation pattern

**Markdown Conversion:**
- `/src/lib/ai/markdown-to-html.ts` - Existing utility
  - Use this to convert OpenAI markdown response to HTML

**Note Creation:**
- `/src/lib/supabase/notes.ts` - Note CRUD operations
  - `createNote()` function handles encryption automatically

### OpenAI Configuration

Following existing pattern from answer route:
```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: VIDEO_SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: `Summarize this video transcript:\n\n${transcript}` }
  ],
  temperature: 0.7,
  max_tokens: 1500,  // Increased for summary format
});
```

### Token Considerations

- gpt-4o-mini has 128k context window
- Most video transcripts are under 50k tokens
- User confirmed no limits needed for personal use
- If truncation needed later, can implement with indicator

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-08 | 1.0 | Initial story creation | Claude (Opus 4.5) |

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used
-

### Debug Log References
-

### Completion Notes List
-

### File List
-
