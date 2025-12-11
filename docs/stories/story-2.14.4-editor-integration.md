# Story 2.14.4: Editor Integration & UX

**Status:** ✅ Implemented
**Created:** 2025-12-08
**Updated:** 2025-12-08
**Epic:** [Epic 2.14 - YouTube Video Embedding & AI Summarization](./epic-2.14-youtube-embed-summarization.md)
**Issue:** #220
**Estimated Duration:** 2-3 days
**Dependencies:** Stories 2.14.1, 2.14.2, 2.14.3 (all must be complete)

---

## Story

As a user writing in my journal,
I want YouTube videos to automatically embed when I paste a link,
and I want to click a button to generate an AI summary of the video,
so that I can seamlessly integrate video content with AI-powered insights into my journaling.

---

## Problem Statement

The infrastructure for URL detection, transcript extraction, and AI summarization exists (Stories 2.14.1-3), but users need an intuitive way to trigger these features. The editor needs to detect YouTube URLs on paste, show the embed, and provide a clear "Summarize Video" button.

---

## Proposed Solution

Integrate all components into the SimpleRichEditor:
1. Detect YouTube URLs when content is pasted
2. Automatically insert embed component below the URL
3. Show "Summarize Video" button on the embed
4. Handle loading states and error messages
5. Display toast notification on success with link to created note

---

## Acceptance Criteria

**AC1: Paste Detection**
- [ ] YouTube URLs detected when pasted into editor
- [ ] Non-YouTube URLs handled normally (plain text)
- [ ] Multiple YouTube URLs in single paste handled
- [ ] URL text remains in editor, embed appears below

**AC2: Embed Insertion**
- [ ] YouTubeEmbed component renders below pasted URL
- [ ] Embed is editable (can be deleted by user)
- [ ] Embed persists on save/reload
- [ ] Works in both journal entries and notes

**AC3: Summarize Button**
- [ ] "Summarize Video" button visible on embed
- [ ] Button has clear icon (e.g., Sparkles or FileText)
- [ ] Button click triggers summarization API
- [ ] Button disabled while loading
- [ ] Button hidden if summarization already done for this video (future enhancement - optional)

**AC4: Loading States**
- [ ] Loading spinner shows while fetching transcript
- [ ] Loading text: "Generating summary..."
- [ ] All inputs disabled during loading
- [ ] User can still scroll/navigate while loading

**AC5: Success Handling**
- [ ] Toast notification: "Video summary created!"
- [ ] Toast includes link to open the summary note
- [ ] Note opens in NoteViewer when toast link clicked

**AC6: Error Handling**
- [ ] Toast for "Transcript not available for this video"
- [ ] Toast for timeout errors
- [ ] Toast for network errors
- [ ] Button re-enabled after error (can retry)

**AC7: Read-Only Mode**
- [ ] Embeds render correctly in JournalStream (read mode)
- [ ] "Summarize Video" button visible in read mode
- [ ] Summary functionality works from read mode

---

## Technical Design

### Files to Modify

**1. `/src/components/editor/SimpleRichEditor.tsx`**

Modify handlePaste (around line 777):
```typescript
const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');

  // Insert text first
  document.execCommand('insertText', false, text);

  // Check for YouTube URL
  const youtubeUrls = detectYouTubeUrls(text);
  if (youtubeUrls.length > 0) {
    // Trigger embed insertion
    onYouTubeDetected?.(youtubeUrls[0]);
  }
}, [onYouTubeDetected]);
```

Add new props:
```typescript
interface SimpleRichEditorProps {
  // ... existing props
  onYouTubeDetected?: (video: { url: string; videoId: string }) => void;
}
```

**2. `/src/components/media/YouTubeEmbed.tsx`**

Complete component with summarize button:
```typescript
interface YouTubeEmbedProps {
  videoId: string;
  videoUrl: string;
  entryId?: string;
  onSummaryCreated?: (noteId: string) => void;
}

export function YouTubeEmbed({ videoId, videoUrl, entryId, onSummaryCreated }: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/youtube/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoId, videoUrl, entryId })
      });
      // Handle response...
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="youtube-embed-container">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        // ... attributes
      />
      <Button onClick={handleSummarize} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {isLoading ? 'Generating...' : 'Summarize Video'}
      </Button>
    </div>
  );
}
```

**3. `/src/components/journal/JournalStream.tsx`**

Ensure embeds render in read-only mode - the sanitized HTML should already include the iframe, but we may need to add the summarize button dynamically.

---

## Tasks / Subtasks

- [ ] **Task 1: Enhance SimpleRichEditor Paste Handling**
  - [ ] Import youtube detection utility
  - [ ] Modify handlePaste to detect YouTube URLs
  - [ ] Add onYouTubeDetected callback prop
  - [ ] Test paste behavior with YouTube URLs
  - [ ] Test paste behavior with non-YouTube content

- [ ] **Task 2: Complete YouTubeEmbed Component**
  - [ ] Add "Summarize Video" button
  - [ ] Implement handleSummarize function
  - [ ] Add loading state management
  - [ ] Add auth token handling
  - [ ] Style button to match app theme

- [ ] **Task 3: Toast Notifications**
  - [ ] Add success toast with note link
  - [ ] Add error toasts for various failure modes
  - [ ] Use existing toast infrastructure

- [ ] **Task 4: Note Viewer Integration**
  - [ ] Handle onSummaryCreated callback
  - [ ] Open NoteViewer with created note
  - [ ] Ensure proper modal management

- [ ] **Task 5: Read-Only Mode Support**
  - [ ] Test embeds in JournalStream
  - [ ] Ensure summarize button works in read mode
  - [ ] Handle entry ID passing in read mode

- [ ] **Task 6: Content Storage**
  - [ ] Ensure embed HTML is saved with journal content
  - [ ] Verify embed survives sanitization
  - [ ] Test reload behavior

- [ ] **Task 7: Testing**
  - [ ] E2E: Paste URL → See embed → Click summarize → See toast → Open note
  - [ ] Test multiple embeds in single entry
  - [ ] Test error scenarios
  - [ ] Test mobile responsiveness
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`
  - [ ] Test on Vercel preview

---

## Dev Notes

### Relevant Source Tree

**Editor:**
- `/src/components/editor/SimpleRichEditor.tsx`
  - Lines 777-781: Current handlePaste implementation
  - Lines 1123-1143: "Ask AI" button pattern to follow

**Toast Usage:**
- Use existing toast infrastructure from shadcn/ui
- Pattern from AskAIDialog success handling

**NoteViewer:**
- `/src/components/notes/NoteViewer.tsx`
  - Open with noteId after successful summary creation

### Content Persistence Strategy

Two approaches for embedding:

**Option A: Store as HTML**
- Insert `<div class="youtube-embed-container">...</div>` into content
- Survives sanitization (after Story 2.14.1 updates)
- Simple but embed is static in saved content

**Option B: Store URL, render dynamically**
- Store just the YouTube URL in content
- Detect and render embed on display
- More complex but allows updating embed behavior

**Recommendation:** Start with Option A (simpler), can enhance later if needed.

### Auth Token Access

For API calls from client components:
```typescript
import { useSession } from 'next-auth/react';
// or
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

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
