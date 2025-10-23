# Story 2.5: Voice Transcription for Journal Entries

**Epic:** 2 - Intelligent Note Linking & Knowledge Graph
**Status:** Ready for Implementation
**Created:** 2025-10-21
**Updated:** 2025-10-21 (QA review incorporated)
**Related Issue:** #64

## User Story

As a reflective journaler,
I want to speak my journal entries instead of typing them,
so that I can capture my thoughts quickly and naturally when typing isn't convenient or when I want to express myself more freely through speech.

## Context

Currently, users must type all journal entries manually. Many users find it easier and more natural to speak their thoughts, especially when:
- They're capturing emotional or stream-of-consciousness reflections
- They want to journal while away from a keyboard (e.g., on mobile)
- They have accessibility needs that make typing difficult
- They want to capture thoughts quickly without breaking their flow

This story adds a voice transcription feature that allows users to speak their journal entries. The system will intelligently transcribe what the user **meant** to say (not just verbatim), cleaning up filler words, false starts, and verbal stumbles while preserving the user's authentic meaning and voice.

## Current vs. Desired Behavior

### Current Behavior
```
┌─────────────────────────────────────────────────┐
│ Journal Entry                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ [User must type here]                       │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Desired Behavior
```
┌─────────────────────────────────────────────────┐
│ Journal Entry                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ [User can type or speak here]              │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 🎤 ← Microphone button (bottom left)            │
└─────────────────────────────────────────────────┘

Click microphone → Recording UI appears:
┌─────────────────────────────────────────────────┐
│ 🔴 Recording...                      [■ Stop]   │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │     ～～～～～～～～～～～～～～～              │ │
│ │         (animated waveform)                 │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

After stopping → Processing UI:
┌─────────────────────────────────────────────────┐
│ ⏳ Audio processing...                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Transcribing your words...                  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

After processing → Text inserted:
┌─────────────────────────────────────────────────┐
│ Journal Entry                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Today I was thinking about how important    │ │
│ │ it is to stay authentic to myself...        │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 🎤                                              │
└─────────────────────────────────────────────────┘
```

## Acceptance Criteria

### AC1: Microphone Button UI
- [ ] Microphone icon (🎤) appears in bottom left corner of journal entry text input
- [ ] Button is positioned absolutely within the editor container
- [ ] Tooltip displays "Transcribe" on hover
- [ ] Button uses consistent styling with existing UI theme
- [ ] Button is accessible via keyboard navigation (Tab to focus, Enter/Space to activate)

### AC2: Recording State
- [ ] Clicking microphone button requests browser microphone permission
- [ ] If permission denied, show friendly error message: "Microphone access required for transcription"
- [ ] Recording starts immediately after permission granted
- [ ] Visual indicator shows recording is active (red dot or pulsing animation)
- [ ] Animated waveform appears that moves in sync with user's speech
- [ ] "Stop Recording" button is clearly visible during recording
- [ ] Clicking microphone button again while recording stops the recording
- [ ] Pressing Escape key stops recording
- [ ] Maximum recording duration is 5 minutes (configurable)

### AC3: Silence Detection & Auto-Processing
- [ ] System detects when user stops speaking (2 seconds of silence by default)
- [ ] After silence timeout, system prompts: "Would you like to keep talking or should we process your words?"
- [ ] Two buttons appear: "Keep Talking" and "Process"
- [ ] "Keep Talking" resumes recording and resets silence timer
- [ ] "Process" begins transcription immediately
- [ ] Timeout duration is configurable (default: 2 seconds)
- [ ] Silence detection is not triggered by brief pauses (< 500ms)

### AC4: Processing State
- [ ] "Audio processing..." message appears when transcription begins
- [ ] Loading spinner or animation indicates work in progress
- [ ] User cannot edit the text input during processing
- [ ] Microphone button is disabled during processing

### AC5: Intent-Based Transcription
- [ ] Audio is sent to OpenAI Whisper API for speech-to-text
- [ ] Raw transcription is sent to GPT-4 (or GPT-5) for intent clarification
- [ ] AI prompt instructs: "Clean up this transcription to reflect what the user meant to say. Remove filler words (um, uh, like), false starts, and verbal stumbles. Preserve the user's authentic voice and meaning. Do not add new ideas."
- [ ] Processed text is inserted at cursor position in journal entry
- [ ] If cursor is not in editor, text is appended to end of entry

### AC6: Error Handling
- [ ] Network errors show friendly message: "Unable to transcribe. Please check your connection and try again."
- [ ] API errors (rate limit, service unavailable) show: "Transcription service temporarily unavailable. Please try again in a moment."
- [ ] If recording fails to start, show: "Unable to access microphone. Please check browser permissions."
- [ ] All errors include a "Try Again" button
- [ ] Failed recordings do not corrupt existing journal entry text

### AC7: User Experience Polish
- [ ] Transcribed text appears smoothly (fade-in animation)
- [ ] User can immediately continue typing after transcription completes
- [ ] Multiple transcriptions can be added to the same journal entry
- [ ] Transcription works in both new and existing journal entries
- [ ] Mobile browsers support the feature (tested on iOS Safari, Chrome)

### AC8: Cross-Browser Recording Support (QA Addition)
- [ ] System detects supported audio codecs via `MediaRecorder.isTypeSupported()`
- [ ] Preferred codec: `audio/webm;codecs=opus` (Chromium, Firefox)
- [ ] Safari fallback: `audio/mp4` or WAV via Web Audio API + AudioWorklet
- [ ] If no supported recording path exists, show: "Voice transcription not supported on this browser"
- [ ] Unsupported browser message includes link to browser compatibility documentation
- [ ] Microphone button is disabled (not hidden) on unsupported browsers
- [ ] Codec selection logged for debugging (e.g., "Using audio/webm;codecs=opus")

### AC9: File Size & Duration Constraints (QA Addition)
- [ ] Target bitrate: ~24 kbps (mono) for OPUS to keep 5-minute recordings ≤ 3 MB
- [ ] Client enforces maximum file size: 4.5 MB (to fit serverless body limits)
- [ ] UI displays countdown timer during recording (e.g., "2:30 remaining")
- [ ] If approaching file size limit (e.g., 90% of 4.5 MB), prompt: "Recording nearly full. Stop to process?"
- [ ] Hard stop at maximum duration (5 minutes) or file size limit (4.5 MB), whichever comes first
- [ ] Sample rate: 16 kHz mono (balances quality vs. file size)
- [ ] Recording size estimation displayed in real-time (e.g., "1.2 MB / 4.5 MB")

### AC10: API Runtime & Serverless Configuration (QA Addition)
- [ ] `/api/transcribe` route declares `export const runtime = 'nodejs'`
- [ ] `/api/transcribe` route declares `export const maxDuration = 60` (or higher per Vercel plan limits)
- [ ] Route validates `Content-Type` is audio format (WebM, MP4, WAV)
- [ ] Route rejects files > 4.5 MB with clear error: "Recording too large. Please record shorter segments."
- [ ] Request body handling strategy documented in code comments
- [ ] Vercel function configuration updated for longer execution time if needed

### AC11: Durable Rate Limiting (QA Addition)
- [ ] Rate limiting uses Upstash Redis (or equivalent durable store)
- [ ] Rate limit key: authenticated user ID; fallback to IP address for guests
- [ ] Limit: 10 requests per minute per user
- [ ] Exceeding limit returns HTTP 429 with `Retry-After` header (seconds until reset)
- [ ] Client respects `Retry-After` and shows: "Too many requests. Please wait [X] seconds."
- [ ] Rate limit state persists across serverless function instances
- [ ] Integration test validates 429 response after 10 requests in 1 minute

### AC12: Accessibility Enhancements (QA Addition)
- [ ] Recording state changes announced via ARIA live region (e.g., "Recording started", "Recording stopped")
- [ ] Processing state announced: "Transcribing audio, please wait"
- [ ] Error states announced: "Transcription failed. [Error message]"
- [ ] All interactive elements (mic button, stop button, prompt buttons) have visible focus indicators
- [ ] Screen reader announces countdown timer updates (throttled to avoid spam)
- [ ] Keyboard shortcuts documented in tooltip or help text

### AC13: Mobile Platform Quirks (QA Addition)
- [ ] iOS Safari: `AudioContext` resumes only after user gesture (mic button click)
- [ ] Mobile keyboard does not obscure microphone button when visible
- [ ] On keyboard open, mic button repositions above keyboard or in floating overlay
- [ ] Mobile recording uses appropriate sample rate (16 kHz) to reduce file size
- [ ] Test on real iOS and Android devices (not just emulators)
- [ ] Handle mobile browser backgrounding gracefully (pause/stop recording if app loses focus)

## Technical Approach

### Architecture

```
┌──────────────────┐
│ Browser (Client) │
│                  │
│  1. MediaRecorder│ ← Captures audio
│  2. Waveform UI  │ ← Visualizes audio
│  3. Silence      │ ← Detects pauses
│     Detection    │
└────────┬─────────┘
         │ Audio Blob
         ↓
┌──────────────────┐
│ /api/transcribe  │ ← Next.js API Route
│                  │
│  1. Receive blob │
│  2. Send to      │
│     Whisper API  │
│  3. Send to GPT  │
│  4. Return text  │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ OpenAI APIs      │
│                  │
│  1. Whisper      │ ← Speech-to-text
│  2. GPT-4/5      │ ← Intent cleanup
└──────────────────┘
```

### Implementation Details

**Frontend Components:**
- `@/components/editor/VoiceTranscribeButton.tsx` - Microphone button with tooltip
- `@/components/editor/RecordingOverlay.tsx` - Recording UI with waveform and countdown
- `@/hooks/useVoiceTranscription.ts` - Recording logic, silence detection, API calls
- `@/utils/audioCodecDetection.ts` - Browser codec capability detection

**Backend API:**
- `@/app/api/transcribe/route.ts` - Handles audio upload, calls Whisper, calls GPT
  - **Runtime:** `export const runtime = 'nodejs'`
  - **Max Duration:** `export const maxDuration = 60` (seconds)
  - **Rate Limiting:** Upstash Redis-based (10 req/min per user)

**Audio Codec Strategy (QA-Required):**
1. **Detect support:** `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')`
2. **Priority order:**
   - `audio/webm;codecs=opus` (Chrome, Firefox) — ~24 kbps, 16 kHz mono
   - `audio/mp4` (Safari/iOS)
   - WAV via Web Audio API + AudioWorklet (universal fallback)
3. **Unsupported browsers:** Show clear error message, disable mic button
4. **Log selected codec** for debugging and analytics

**File Size Management (QA-Required):**
- **Target bitrate:** 24 kbps (mono) for OPUS
- **Sample rate:** 16 kHz (balances quality vs. size)
- **Max file size:** 4.5 MB (serverless body limit)
- **Max duration:** 5 minutes OR file size limit (whichever comes first)
- **Real-time size estimation:** Display "X MB / 4.5 MB" during recording
- **90% warning:** Prompt user when nearing limit
- **Hard stop:** Auto-stop and process at limit

**Waveform Visualization:**
- Use Web Audio API `AnalyserNode` for real-time frequency data
- Render waveform using Canvas (lightweight, performant)
- Alternative: SVG for accessibility/styling flexibility
- Consider lightweight library: `wavesurfer.js` or custom implementation

**Silence Detection:**
- Analyze audio volume using Web Audio API
- Threshold: < 10% of max volume = silence
- Configurable timeout: 2 seconds default
- Reset timer on any speech detected
- Throttle announcements to screen readers (max 1/second)

**AI Processing Pipeline:**
1. Audio blob → Whisper API → Raw transcription
2. Raw transcription → GPT-4 with prompt:
   ```
   You are a transcription assistant. Clean up this spoken transcription to reflect
   what the user meant to say. Remove filler words (um, uh, like, you know), false
   starts, and verbal stumbles. Preserve the user's authentic voice, tone, and meaning.
   Do not add new ideas or change the intent. Return only the cleaned text.

   Transcription:
   [RAW_TEXT]
   ```
3. GPT response → Insert into editor

**Error Handling:**
- Retry logic for network failures (max 3 attempts with exponential backoff)
- Graceful degradation: If GPT fails, return raw Whisper transcription
- Clear error messages for permission denials, API failures
- Handle browser-specific errors (codec unsupported, microphone unavailable)
- Log errors with structured data (request ID, error code, duration) — **no PII**

**Security & Privacy (QA-Required):**
- Audio data sent over HTTPS only
- Audio blobs **not stored server-side** (processed in-memory only)
- **Durable rate limiting:** Upstash Redis (10 req/min per user ID; IP fallback for guests)
- Rate limit response: HTTP 429 with `Retry-After` header
- Validate audio file size: max 4.5 MB (client-enforced), reject oversize on server
- Validate `Content-Type` on server (must be audio/webm, audio/mp4, or audio/wav)
- Update privacy policy: third-party processing by OpenAI (no long-term storage)
- Scrub logs for PII (no transcription content in logs)

**Observability (QA-Required):**
- Structured logging with request ID, user ID (hashed), timestamps
- Log key metrics:
  - Recording duration (seconds)
  - File size (bytes)
  - Codec used (webm/opus, mp4, wav)
  - Whisper API latency (ms)
  - GPT API latency (ms)
  - Total processing time (ms)
  - Error codes and types
- **No PII in logs:** Do not log audio data, transcription text, or user content
- Consider: Application Insights or similar for production monitoring

### Environment Variables Required

```env
# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_GPT_MODEL=gpt-4-turbo

# Rate Limiting (QA-Required)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: Observability
NEXT_PUBLIC_APP_INSIGHTS_KEY=...
```

### Browser Compatibility

**Supported:**
- Chrome 49+ (MediaRecorder, Web Audio API)
- Firefox 25+
- Safari 14.1+ (iOS 14.3+)
- Edge 79+

**Unsupported:**
- Internet Explorer (show feature unavailable message)
- Opera Mini (limited MediaRecorder support)

## Test Plan

### Manual Testing Checklist

**Basic Flow:**
- [ ] Click microphone button → recording starts
- [ ] Speak 2-3 sentences → stop recording
- [ ] Verify text appears in journal entry
- [ ] Text is cleaned up (no "um", "uh", etc.)
- [ ] Verify text preserves user's intent

**Silence Detection:**
- [ ] Speak, pause 3 seconds → prompt appears
- [ ] Click "Keep Talking" → recording resumes
- [ ] Click "Process" → transcription begins
- [ ] Verify timeout is ~2 seconds

**Error Handling:**
- [ ] Deny microphone permission → see error message
- [ ] Disconnect network mid-recording → see error
- [ ] Click "Try Again" → recording restarts

**UI/UX:**
- [ ] Waveform animates during speech
- [ ] Waveform stops during silence
- [ ] "Processing..." appears during transcription
- [ ] Microphone button disabled during processing
- [ ] Multiple recordings in same entry work

**Accessibility:**
- [ ] Tab to microphone button → Enter/Space activates
- [ ] Screen reader announces "Transcribe" on focus
- [ ] Escape key stops recording
- [ ] Recording state announced to screen readers

**Mobile Testing:**
- [ ] iOS Safari: Recording works
- [ ] Android Chrome: Recording works
- [ ] Mobile UI: Button placement not obscured by keyboard

**Edge Cases:**
- [ ] Empty recording (no speech) → show error
- [ ] Very long recording (5+ minutes) → max duration enforced
- [ ] Rapid start/stop → no crashes
- [ ] Switch to different entry during recording → recording stops safely

**Cross-Browser Codec Testing (QA-Required):**
- [ ] Chrome: Uses `audio/webm;codecs=opus` → verify in console logs
- [ ] Firefox: Uses `audio/webm;codecs=opus` → verify in console logs
- [ ] Safari (macOS): Uses `audio/mp4` fallback → verify in console logs
- [ ] iOS Safari: Uses `audio/mp4` or WAV fallback → verify on real device
- [ ] Unsupported browser (IE, old Safari): Shows "not supported" message, button disabled
- [ ] Codec selection logged for each recording attempt

**File Size & Duration Limits (QA-Required):**
- [ ] Record 30-second clip → verify size < 500 KB
- [ ] Record 2-minute clip → verify size ~1-1.5 MB
- [ ] Record 5-minute clip → verify size ~3 MB, under 4.5 MB limit
- [ ] Countdown timer displays during recording (e.g., "2:30 remaining")
- [ ] Real-time size estimation displays (e.g., "1.2 MB / 4.5 MB")
- [ ] Approaching 90% of 4.5 MB → prompt appears: "Recording nearly full. Stop to process?"
- [ ] Hitting 4.5 MB limit → recording auto-stops and processes
- [ ] Hitting 5-minute limit → recording auto-stops and processes

**Rate Limiting (QA-Required):**
- [ ] Make 10 requests in < 1 minute → 11th request returns HTTP 429
- [ ] 429 response includes `Retry-After` header with seconds value
- [ ] Client shows: "Too many requests. Please wait [X] seconds."
- [ ] Wait for `Retry-After` duration → next request succeeds
- [ ] Rate limit persists across page reloads (durable in Upstash Redis)
- [ ] Different users have independent rate limits

**Observability (QA-Required):**
- [ ] Check server logs for structured data: request ID, codec, file size, durations
- [ ] Verify Whisper API latency logged (ms)
- [ ] Verify GPT API latency logged (ms)
- [ ] Verify total processing time logged (ms)
- [ ] Verify error codes logged for failures
- [ ] Verify **no PII in logs** (no transcription text, no audio data)
- [ ] Request ID matches across client and server logs for correlation

### Automated Testing (Future)

**E2E Tests (Playwright):**
```typescript
test('Voice transcription adds text to journal entry', async ({ page }) => {
  // Mock MediaRecorder API
  // Mock /api/transcribe response
  // Click microphone button
  // Verify recording UI appears
  // Stop recording
  // Verify "Processing..." appears
  // Verify transcribed text inserted
});
```

**Unit Tests (Jest):**
- Silence detection logic
- Audio blob processing
- Error handling states

## Open Questions & Decisions

### Q1: Default Silence Timeout Duration?
**Options:**
- 1 second (fast, may interrupt long pauses)
- 2 seconds (balanced - **RECOMMENDED**)
- 3 seconds (patient, may feel slow)

**Decision:** 2 seconds default, make configurable in future user settings

### Q2: Should We Store Audio Files?
**Options:**
- Yes, store in Supabase Storage for user review/re-transcription
- No, process and discard (privacy-first approach)

**Decision:** **No** - Process in-memory and discard. Privacy-first. Future story can add opt-in storage.

### Q3: Show Preview Before Inserting Text?
**Options:**
- Insert immediately (faster, less friction)
- Show preview modal with "Insert" / "Retry" buttons (more control)

**Decision:** **Insert immediately** for MVP. Future story can add preview/edit step.

### Q4: Maximum Recording Duration?
**Recommendation:** 5 minutes (balances user needs vs. API costs)
**Whisper API Limit:** 25MB file size
**Typical WebM file size:** ~1-2MB per minute
**Safety margin:** 5 minutes = ~10MB (well under 25MB)

### Q5: Which GPT Model for Intent Cleanup?
**Options:**
- GPT-4 Turbo (proven, reliable, $0.01/1K tokens)
- GPT-5 (latest, may be better at intent understanding, pricing TBD)
- GPT-3.5 (cheaper, $0.001/1K tokens, may be less accurate)

**Decision:** Start with **GPT-4 Turbo** for MVP. A/B test GPT-5 in future story if available.

### Q6: How to Signal "Done Talking"?
**Options:**
- A) Click microphone button again
- B) Dedicated "Stop" button
- C) Escape key
- D) All of the above

**Decision:** **D - All of the above** for maximum accessibility and user preference

### Q7: Mobile Keyboard Overlap?
**Issue:** On mobile, keyboard may obscure microphone button
**Solution:** Detect keyboard open event, reposition button above keyboard or show floating overlay

## Implementation Phases

### Phase 1: Audio Codec Detection & Fallback Strategy (3-4 days) — QA-Critical
- [ ] Create `@/utils/audioCodecDetection.ts` utility
- [ ] Implement `MediaRecorder.isTypeSupported()` checks for: `audio/webm;codecs=opus`, `audio/mp4`, WAV
- [ ] Build codec priority fallback logic (OPUS → MP4 → WAV)
- [ ] Implement WAV recording via Web Audio API + AudioWorklet (if needed)
- [ ] Log selected codec on each recording start
- [ ] Handle unsupported browsers: show clear error, disable mic button
- [ ] Test on Chrome, Firefox, Safari (macOS), iOS Safari, Android Chrome

### Phase 2: UI Foundation & Accessibility (2-3 days)
- [ ] Add microphone button to `@/components/editor/SimpleRichEditor.tsx`
- [ ] Tooltip on hover: "Transcribe"
- [ ] Keyboard navigation support (Tab, Enter/Space)
- [ ] ARIA labels and live regions for state announcements
- [ ] Mobile positioning (handle keyboard overlay)
- [ ] Disabled state styling for unsupported browsers

### Phase 3: Audio Recording with Size Constraints (3-4 days) — QA-Critical
- [ ] MediaRecorder integration with selected codec
- [ ] Browser permission handling (show friendly errors)
- [ ] Start/stop recording functionality
- [ ] Real-time file size estimation (display "X MB / 4.5 MB")
- [ ] Countdown timer (display "X:XX remaining")
- [ ] 90% size warning prompt: "Recording nearly full. Stop to process?"
- [ ] Hard stop at 4.5 MB OR 5 minutes (whichever first)
- [ ] Error handling: permission denied, MediaRecorder failures
- [ ] Sample rate: 16 kHz mono; bitrate: ~24 kbps (OPUS)

### Phase 4: Waveform Visualization (**FUTURE FEATURE - SKIPPED**)
- [ ] Web Audio API integration with `AnalyserNode`
- [ ] Real-time waveform rendering (Canvas)
- [ ] Animation synced to speech
- [ ] Recording overlay UI component (`@/components/editor/RecordingOverlay.tsx`)
- [ ] Stop button UX (multiple methods: click mic, Escape, dedicated Stop button)

**Status:** Deferred to future iteration. Phase 3 RecordingIndicator provides sufficient visual feedback.

### Phase 5: Silence Detection (**FUTURE FEATURE - SKIPPED**)
- [ ] Audio volume analysis using Web Audio API
- [ ] Silence timer logic (2-second default, configurable)
- [ ] "Keep Talking / Process" prompt UI
- [ ] Auto-processing on timeout
- [ ] Throttled screen reader announcements (max 1/second)

**Status:** Deferred to future iteration. Manual stop button provides sufficient control.

### Phase 6: Backend API with Rate Limiting (4-5 days) — QA-Critical
- [ ] Create `/api/transcribe/route.ts`
- [ ] Set `export const runtime = 'nodejs'`
- [ ] Set `export const maxDuration = 60` (or higher per plan)
- [ ] Validate `Content-Type` (audio/webm, audio/mp4, audio/wav)
- [ ] Validate file size < 4.5 MB (reject with clear error)
- [ ] Integrate Upstash Redis for durable rate limiting
- [ ] Implement rate limit: 10 req/min per user ID (IP fallback for guests)
- [ ] Return HTTP 429 with `Retry-After` header on rate limit
- [ ] Whisper API integration (`openai.audio.transcriptions.create`)
- [ ] GPT-4 intent cleanup (low temperature, token cap)
- [ ] Error handling and retry logic (max 3 attempts, exponential backoff)
- [ ] Graceful degradation: return raw Whisper text if GPT fails
- [ ] Structured logging: request ID, codec, file size, latencies, errors (no PII)

### Phase 7: Integration & Client-Side Rate Limit Handling (2-3 days)
- [ ] Connect frontend to `/api/transcribe`
- [ ] Handle 429 responses: parse `Retry-After`, show "Please wait [X] seconds"
- [ ] Insert transcribed text into editor at cursor position
- [ ] Processing state UI ("Transcribing audio, please wait...")
- [ ] Error messages for API failures (network, rate limit, oversize)
- [ ] Loading states and animations (fade-in transcribed text)

### Phase 8: Observability & Logging (1-2 days) — QA-Critical
- [ ] Implement structured logging on server (request ID, codec, durations, errors)
- [ ] Ensure **no PII in logs** (no audio, no transcription text)
- [ ] Log Whisper API latency, GPT API latency, total processing time
- [ ] Client-side logging: codec selection, file size, recording duration
- [ ] Request ID correlation between client and server
- [ ] Optional: Application Insights integration for production monitoring

### Phase 9: Testing & Refinement (3-4 days) — QA-Critical
- [ ] Complete manual testing checklist (all browsers, mobile devices)
- [ ] Cross-browser codec testing (Chrome, Firefox, Safari, iOS, Android)
- [ ] File size/duration limit testing (30s, 2m, 5m recordings)
- [ ] Rate limiting integration tests (10+ requests in 1 minute)
- [ ] Accessibility testing (screen readers, keyboard navigation, ARIA)
- [ ] Edge case handling (rapid start/stop, switch entries, network failures)
- [ ] Performance optimization (minimize re-renders, memory leaks)
- [ ] Observability validation (logs structured correctly, no PII)

**Total Estimated Effort:** 20-28 days (4-5.5 weeks) — *Increased from original estimate due to QA-required technical depth*

## Dependencies

**Technical:**
- OpenAI API access (Whisper + GPT-4)
- Upstash Redis account for durable rate limiting (QA-Required)
- Browser MediaRecorder API support
- Web Audio API support
- HTTPS connection (required for microphone access)

**Code:**
- `@/components/editor/SimpleRichEditor.tsx` (existing component to extend)
- OpenAI client library (`openai` npm package)
- Upstash Redis client (`@upstash/ratelimit` and `@upstash/redis`)
- Next.js API routes with Node.js runtime

**Environment:**
- `OPENAI_API_KEY` environment variable
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (QA-Required)
- Vercel deployment with increased API route timeout (`maxDuration: 60+`)

## Success Metrics

**Usage:**
- 20%+ of journal entries use voice transcription within first month
- Average transcription length: 50-200 words

**Quality:**
- User satisfaction: 4+ stars on post-transcription feedback (future feature)
- Retry rate: < 10% (indicates high transcription accuracy)

**Performance:**
- Transcription completion time: < 5 seconds for 1-minute recording
- Error rate: < 5% (network failures, API errors)

**Accessibility:**
- 100% keyboard navigable
- Screen reader compatible
- Mobile browser support (iOS Safari, Android Chrome)

## Future Enhancements (Not in Scope)

- **Story 2.5.1:** Transcription preview/edit before inserting
- **Story 2.5.2:** User settings for silence timeout, model selection
- **Story 2.5.3:** Multi-language support (Whisper supports 50+ languages)
- **Story 2.5.4:** Speaker diarization (identify multiple speakers)
- **Story 2.5.5:** Audio storage in Supabase for re-transcription
- **Story 2.5.6:** Real-time streaming transcription (instead of waiting until done)
- **Story 2.5.7:** Voice commands ("new paragraph", "delete that", etc.)
- **Story 2.5.8:** Emotional tone analysis and mood tracking

## Related Documentation

- GitHub Issue: #64
- OpenAI Whisper API Docs: https://platform.openai.com/docs/guides/speech-to-text
- MDN MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Accessibility: WCAG 2.1 Guidelines for audio controls

## Notes

**Privacy Considerations:**
- Audio data is ephemeral (not stored)
- OpenAI API processes data per their terms of service
- Users should be informed via privacy policy update

**Cost Estimate:**
- Whisper API: $0.006 per minute
- GPT-4 Turbo: ~$0.01 per transcription (avg 200 tokens)
- Total: ~$0.02 per 1-minute transcription
- 1000 transcriptions/month = $20

**Mobile Considerations:**
- iOS Safari requires user gesture to access microphone (button click = OK)
- Android Chrome may have different audio format support
- Test on real devices, not just emulators

## QA Results

### Gate Decision
- PASS — Story now includes explicit Acceptance Criteria (AC8–AC13) and implementation details covering the previously identified feasibility gaps (codec fallback, body limits/timeouts, durable rate limiting, accessibility, and observability).

### Strengths
- Acceptance Criteria are comprehensive and testable from UI, platform, and infrastructure perspectives.
- Technical approach documents codec selection strategy, file-size management, structured logging, and rate limiting specifics.
- Implementation plan and dependencies reflect the new requirements (Node runtime config, Upstash Redis, `@/` aliases).
- Manual test plan now enumerates cross-browser codec verification, file-size boundaries, rate-limit handling, and observability checks.

### Residual Risks & Watchouts
- **Safari/WAV fallback size:** WAV fallback will hit the 4.5 MB limit in ~2.3 minutes at 16 kHz mono; ensure the countdown/size warnings are prominent so users understand why recording may stop early on unsupported codecs.
- **Bitrate control:** `MediaRecorder` bitrate options are UA-dependent; validate that the targeted ~24 kbps OPUS setting is honored in practice, otherwise adjust the limit calculations.
- **Vercel limits:** Monitor telemetry to confirm the `maxDuration` and request-body limit are sufficient under production latency; Whisper+GPT peaks could still approach hard limits.
- **Rate Limiting UX:** Confirm client-side Retry-After handling is resilient (e.g., background tab timers, mobile wake-from-sleep scenarios).

### Follow-Up
- No additional blocking changes requested. Proceed to implementation with the above watchouts captured in engineering notes or subtasks. Retest after development to verify cross-browser codec coverage and rate-limit handling under real network conditions.
