# Story 2.14.1: YouTube URL Detection & Embed Component

**Status:** 📋 Draft
**Created:** 2025-12-08
**Updated:** 2025-12-08
**Epic:** [Epic 2.14 - YouTube Video Embedding & AI Summarization](./epic-2.14-youtube-embed-summarization.md)
**Issue:** #220
**Estimated Duration:** 2-3 days

---

## Story

As a user writing in my journal or notes,
I want YouTube URLs to be automatically detected and displayed as embedded video players,
so that I can watch videos within my journal/notes without leaving the app.

---

## Problem Statement

When users paste YouTube video links into journal entries or notes, the links appear as plain text. Users must click away from their writing context to watch videos, breaking their flow.

---

## Proposed Solution

Create a YouTube URL detection utility and embed component that:
1. Detects YouTube URLs in pasted content
2. Renders responsive embedded video players
3. Securely allows only YouTube iframes through HTML sanitization
4. Provides consistent styling in both edit and read-only modes

---

## Acceptance Criteria

**AC1: URL Detection Utility**
- [ ] Utility correctly detects `youtube.com/watch?v=VIDEO_ID` URLs
- [ ] Utility correctly detects `youtu.be/VIDEO_ID` short URLs
- [ ] Utility correctly detects `youtube.com/embed/VIDEO_ID` URLs
- [ ] Utility extracts 11-character video ID from URLs
- [ ] Utility returns null for invalid/non-YouTube URLs
- [ ] Utility handles URLs with additional query parameters (e.g., `?v=ID&t=123`)

**AC2: Embed Component**
- [ ] Component renders YouTube iframe embed
- [ ] Uses youtube-nocookie.com for privacy-enhanced mode
- [ ] Maintains 16:9 aspect ratio (responsive)
- [ ] Has rounded corners matching app theme
- [ ] Includes loading="lazy" for performance
- [ ] Works on mobile, tablet, and desktop

**AC3: Secure Iframe Handling**
- [ ] `iframe` tag added to sanitizeHtml ALLOWED_TAGS
- [ ] Domain filter hook restricts iframes to YouTube domains only:
  - `youtube.com`
  - `www.youtube.com`
  - `www.youtube-nocookie.com`
- [ ] Non-YouTube iframes are stripped during sanitization
- [ ] Malformed URLs are stripped

**AC4: CSS Styling**
- [ ] `.youtube-embed-container` class styled for both `.rich-editor-body` and `.prose`
- [ ] Responsive container with max-width
- [ ] Proper margins for spacing
- [ ] Border matching app theme
- [ ] Dark mode support

---

## Technical Design

### Files to Create

**1. `/src/utils/youtube.ts`**
```typescript
// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeVideoId(url: string): string | null
export function isYouTubeUrl(text: string): boolean
export function getEmbedUrl(videoId: string): string // returns youtube-nocookie.com embed URL
export function detectYouTubeUrls(content: string): Array<{ url: string; videoId: string; startIndex: number; endIndex: number }>
```

**2. `/src/components/media/YouTubeEmbed.tsx`**
```typescript
interface YouTubeEmbedProps {
  videoId: string;
  onSummarize?: () => void;  // For Story 2.14.4
  isLoading?: boolean;       // For Story 2.14.4
}
```

### Files to Modify

**1. `/src/utils/sanitizeHtml.ts`**

Add to ALLOWED_TAGS:
```typescript
'iframe'
```

Add to ALLOWED_ATTR:
```typescript
'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading'
```

Add domain filter hook:
```typescript
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (node.tagName === 'IFRAME' && data.attrName === 'src') {
    const allowedDomains = ['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'];
    try {
      const url = new URL(data.attrValue);
      if (!allowedDomains.includes(url.hostname)) {
        data.keepAttr = false;
      }
    } catch {
      data.keepAttr = false;
    }
  }
});
```

**2. `/src/app/globals.css`**

Add embed styling:
```css
/* YouTube embed styling for edit mode */
.rich-editor-body .youtube-embed-container {
  position: relative;
  width: 100%;
  max-width: 560px;
  margin: 1rem 0;
}

.rich-editor-body .youtube-embed-container iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
}

/* Read-only mode styling */
.prose .youtube-embed-container {
  position: relative;
  width: 100%;
  max-width: 560px;
  margin: 1rem 0;
}

.prose .youtube-embed-container iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
}
```

---

## Tasks / Subtasks

- [ ] **Task 1: Create YouTube URL Detection Utility**
  - [ ] Create `/src/utils/youtube.ts`
  - [ ] Implement `extractYouTubeVideoId()` function
  - [ ] Implement `isYouTubeUrl()` function
  - [ ] Implement `getEmbedUrl()` function
  - [ ] Implement `detectYouTubeUrls()` function
  - [ ] Add unit tests for all URL patterns

- [ ] **Task 2: Create YouTubeEmbed Component**
  - [ ] Create `/src/components/media/` directory
  - [ ] Create `YouTubeEmbed.tsx` component
  - [ ] Implement responsive iframe rendering
  - [ ] Add sandbox attributes for security
  - [ ] Add placeholder for "Summarize Video" button (wired in Story 2.14.4)

- [ ] **Task 3: Update sanitizeHtml.ts**
  - [ ] Add `iframe` to ALLOWED_TAGS
  - [ ] Add iframe-related attributes to ALLOWED_ATTR
  - [ ] Implement domain filtering hook for YouTube only
  - [ ] Test that non-YouTube iframes are stripped
  - [ ] Test that malformed URLs are stripped

- [ ] **Task 4: Add CSS Styling**
  - [ ] Add `.youtube-embed-container` styles to globals.css
  - [ ] Style for `.rich-editor-body` (edit mode)
  - [ ] Style for `.prose` (read-only mode)
  - [ ] Test responsive behavior
  - [ ] Test dark mode

- [ ] **Task 5: Testing**
  - [ ] Test URL detection with various YouTube URL formats
  - [ ] Test embed rendering in editor
  - [ ] Test sanitization strips non-YouTube iframes
  - [ ] Test mobile responsiveness
  - [ ] Run `npm run lint` and fix issues
  - [ ] Run `npm run build` and verify

---

## Dev Notes

### Relevant Source Tree

**Utilities:**
- `/src/utils/sanitizeHtml.ts` - DOMPurify configuration
  - Lines 27-34: ALLOWED_TAGS array
  - Lines 49-77: Style filtering hook (pattern to follow for iframe hook)

**Styling:**
- `/src/app/globals.css` - Global CSS
  - Lines 216-372: Editor and prose styling (add embed styles nearby)

### Security Considerations

1. **Domain Allowlist**: Critical that only trusted YouTube domains are allowed
2. **Sandbox Attribute**: Use `sandbox="allow-scripts allow-same-origin allow-presentation"`
3. **No User-Controlled URLs**: Video IDs are validated against strict pattern
4. **Privacy Mode**: Use `youtube-nocookie.com` to reduce tracking

### Testing Patterns

Test URLs that SHOULD work:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtube.com/watch?v=dQw4w9WgXcQ`
- `http://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123`

Test URLs that should NOT work:
- `https://vimeo.com/123456`
- `https://evil.com/fake?v=dQw4w9WgXcQ`
- `javascript:alert('xss')`
- Invalid video IDs (wrong length, special characters)

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
