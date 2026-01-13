# Story 2.14.2: YouTube Transcript Extraction API

**Status:** 📋 Draft
**Created:** 2025-12-08
**Updated:** 2025-12-08
**Epic:** [Epic 2.14 - YouTube Video Embedding & AI Summarization](./epic-2.14-youtube-embed-summarization.md)
**Issue:** #220
**Estimated Duration:** 2-3 days
**Dependencies:** Story 2.14.1 (URL utilities)

---

## Story

As a user who wants to summarize a YouTube video,
I want the system to extract the transcript from the video,
so that the AI can generate an accurate summary of the video content.

---

## Problem Statement

To generate AI summaries of YouTube videos, we need access to the video's transcript. YouTube provides auto-generated and user-uploaded captions, but there's no official public API for transcript extraction. We need to use a library that can reliably fetch transcripts.

---

## Proposed Solution

Create an API route that uses the `youtube-transcript` npm package to fetch video transcripts:
1. Add `youtube-transcript` package to dependencies
2. Create transcript service wrapper for consistent error handling
3. Create API route that validates video ID and returns transcript text
4. Handle edge cases (private videos, no transcript, language selection)

---

## Acceptance Criteria

**AC1: npm Package Installation**
- [ ] `youtube-transcript` package added to package.json
- [ ] Package version locked for stability
- [ ] `npm install` runs successfully
- [ ] No security vulnerabilities in package

**AC2: Transcript Service**
- [ ] Service wrapper created at `/src/lib/youtube/transcript.ts`
- [ ] Function to fetch transcript by video ID
- [ ] Returns concatenated transcript text
- [ ] Handles errors gracefully (throws typed errors)

**AC3: API Route**
- [ ] Route created at `/src/app/api/youtube/transcript/route.ts`
- [ ] Uses Edge runtime for longer timeout
- [ ] Validates video ID format (11 alphanumeric characters)
- [ ] Returns transcript text and metadata
- [ ] Requires authentication (Bearer token)

**AC4: Error Handling**
- [ ] Returns 400 for invalid video ID format
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 when transcript not available
- [ ] Returns 500 for unexpected errors
- [ ] All errors have user-friendly messages

**AC5: Response Format**
- [ ] Returns JSON with transcript text
- [ ] Includes video duration if available
- [ ] Includes detected language
- [ ] Returns empty string if transcript disabled (not error)

---

## Technical Design

### Files to Create

**1. `/src/lib/youtube/transcript.ts`**
```typescript
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptResult {
  text: string;
  segments: Array<{
    text: string;
    offset: number;
    duration: number;
  }>;
  language?: string;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptResult>
export function validateVideoId(videoId: string): boolean
```

**2. `/src/app/api/youtube/transcript/route.ts`**
```typescript
export const runtime = 'edge';

// POST /api/youtube/transcript
// Body: { videoId: string }
// Returns: { transcript: string, language?: string, segmentCount: number }
```

### Request/Response Schema

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Success Response (200):**
```json
{
  "transcript": "Full concatenated transcript text...",
  "language": "en",
  "segmentCount": 145,
  "durationSeconds": 212
}
```

**Error Response (404):**
```json
{
  "error": "Transcript not available for this video",
  "code": "TRANSCRIPT_NOT_FOUND"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid video ID format",
  "code": "INVALID_VIDEO_ID"
}
```

---

## Tasks / Subtasks

- [ ] **Task 1: Add npm Package**
  - [ ] Run `npm install youtube-transcript`
  - [ ] Verify package.json updated
  - [ ] Check for security advisories
  - [ ] Test basic import works

- [ ] **Task 2: Create Transcript Service**
  - [ ] Create `/src/lib/youtube/` directory
  - [ ] Create `transcript.ts` service file
  - [ ] Implement `fetchTranscript()` function
  - [ ] Implement `validateVideoId()` function
  - [ ] Handle segment concatenation
  - [ ] Add TypeScript types

- [ ] **Task 3: Create API Route**
  - [ ] Create `/src/app/api/youtube/transcript/route.ts`
  - [ ] Add Edge runtime config
  - [ ] Implement auth check (Bearer token)
  - [ ] Implement video ID validation
  - [ ] Call transcript service
  - [ ] Return formatted response

- [ ] **Task 4: Error Handling**
  - [ ] Define error codes (TRANSCRIPT_NOT_FOUND, INVALID_VIDEO_ID, etc.)
  - [ ] Handle library-specific errors
  - [ ] Map to HTTP status codes
  - [ ] Add logging for debugging

- [ ] **Task 5: Testing**
  - [ ] Test with video that has transcript
  - [ ] Test with video that has no transcript
  - [ ] Test with private video
  - [ ] Test with invalid video ID
  - [ ] Test without auth token
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`

---

## Dev Notes

### Relevant Source Tree

**API Patterns:**
- `/src/app/api/ai/answer/route.ts` - Auth pattern, error handling
  - Lines 38-73: Auth and validation pattern
  - Lines 124-150: Response formatting

**Auth Pattern:**
```typescript
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const token = authHeader.split(' ')[1];
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
const { data: { user } } = await supabase.auth.getUser();
```

### Library Notes

The `youtube-transcript` package:
- Fetches transcripts without requiring API key
- Supports auto-generated and manual captions
- Returns array of segments with text, offset, duration
- May fail for:
  - Private videos
  - Videos with captions disabled
  - Region-restricted videos
  - Very new videos (captions processing)

### Concatenation Strategy

Segments are returned individually. Concatenate with spaces:
```typescript
const fullText = segments.map(s => s.text).join(' ');
```

For very long videos, consider:
- Chunking by time (e.g., 10-minute sections)
- Total character limits
- But user confirmed no limits needed for personal use

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
