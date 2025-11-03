# Story 1.9.3: API: /api/ai/answer Endpoint for AI Responses

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#123](https://github.com/levineam/Signum/issues/123)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a system,
I want an API endpoint that generates AI-powered answers to research queries,
so that users can get immediate insights for their query-based tasks.

## Acceptance Criteria

1. **API Endpoint Created**
   - [ ] `/api/ai/answer` endpoint accepts POST requests
   - [ ] Requires authentication (Supabase Auth session)
   - [ ] Accepts `taskId` and `taskText` in request body
   - [ ] Returns JSON response with AI-generated answer and metadata

2. **OpenAI Integration**
   - [ ] Uses OpenAI API (GPT-4o-mini for cost-efficiency, GPT-4o for complex queries)
   - [ ] System prompt optimized for concise, well-sourced research answers
   - [ ] Handles markdown formatting in responses
   - [ ] Implements proper error handling for OpenAI API failures

3. **Response Quality**
   - [ ] Answers are concise (200-500 words for simple queries, up to 1000 for complex)
   - [ ] Prompt encourages citation-style phrasing (e.g., "According to..." or "Research shows...") where appropriate
   - [ ] Answers are formatted in markdown (headings, lists, bold, etc.)
   - [ ] Answers avoid hallucination by acknowledging uncertainty when appropriate
   - [ ] Note: Verifiable sources/citations would require future RAG/retrieval enhancement

4. **Performance & Reliability**
   - [ ] API responds within 10 seconds (or returns timeout error)
   - [ ] Implements retry logic for transient OpenAI API errors
   - [ ] Logs errors for debugging and monitoring
   - [ ] Returns appropriate HTTP status codes (200, 400, 401, 429, 500)

5. **Security & Validation**
   - [ ] Validates user is authenticated before processing request
   - [ ] Validates `taskId` exists and belongs to authenticated user
   - [ ] Sanitizes input to prevent prompt injection attacks
   - [ ] Rate limiting applied (see Story 1.9.6 for implementation)

6. **Response Format**
   - [ ] Success response includes:
     - `answer: string` (markdown-formatted AI response)
     - `taskId: string` (original task ID)
     - `noteId: string` (ID of created note, handled in Story 1.9.4)
     - `tokensUsed: number` (for cost tracking)
   - [ ] Error response includes:
     - `error: string` (user-friendly error message)
     - `code: string` (machine-readable error code)

## Tasks / Subtasks

- [ ] **Create API Route** (AC: #1)
  - [ ] Create `/src/app/api/ai/answer/route.ts`
  - [ ] Implement POST handler
  - [ ] Add `export const runtime = 'nodejs'` for Node.js runtime
  - [ ] Add authentication check using Supabase Auth (anon key + Bearer token, RLS-safe pattern)
  - [ ] Validate request body schema (taskId, taskText required)

- [ ] **Implement OpenAI Integration** (AC: #2)
  - [ ] Import OpenAI SDK (already installed for Story 2.4.3)
  - [ ] Create OpenAI client with API key from env vars
  - [ ] Design system prompt for research answers
  - [ ] Call OpenAI Chat Completions API
  - [ ] Extract and return AI response

- [ ] **Design System Prompt** (AC: #3)
  - [ ] Optimize prompt for concise, accurate research answers
  - [ ] Encourage citation-style phrasing in prompt (e.g., "According to...", "Research suggests...")
  - [ ] Note: Without RAG/retrieval, cannot provide verifiable sources; focus on authoritative language patterns
  - [ ] Instruct model to use markdown formatting
  - [ ] Instruct model to acknowledge uncertainty
  - [ ] Test prompt with various query types

- [ ] **Add Error Handling** (AC: #4, #5)
  - [ ] Catch OpenAI API errors (rate limits, timeouts, etc.)
  - [ ] Catch database errors (invalid task ID, etc.)
  - [ ] Return appropriate HTTP status codes
  - [ ] Log errors to console (or monitoring service)

- [ ] **Implement Input Validation** (AC: #5)
  - [ ] Validate `taskId` is valid UUID
  - [ ] Validate `taskText` is non-empty string (<500 chars)
  - [ ] Verify task belongs to authenticated user (query Supabase)
  - [ ] Sanitize input to prevent prompt injection

- [ ] **Add Response Formatting** (AC: #6)
  - [ ] Format success response with answer, taskId, noteId, tokensUsed
  - [ ] Format error response with error message and code
  - [ ] Ensure JSON response is properly typed

- [ ] **Implement Timeout Handling** (AC: #4)
  - [ ] Set 10-second timeout for OpenAI API call
  - [ ] Return 408 Request Timeout if exceeded
  - [ ] Abort OpenAI request on timeout

- [ ] **Add Logging and Monitoring** (AC: #4)
  - [ ] Log API calls (task ID, user ID, timestamp)
  - [ ] Log errors with stack traces
  - [ ] Log token usage for cost tracking
  - [ ] Optional: Integrate with monitoring service (e.g., Sentry)

## Dev Notes

### Technical Summary

Create a secure API endpoint that accepts research query tasks and generates AI-powered answers using OpenAI's API. The endpoint must validate user authentication, sanitize inputs, handle errors gracefully, and return well-formatted markdown responses.

### Implementation Approach

**API Route Structure:**

```typescript
// /src/app/api/ai/answer/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Node.js runtime for OpenAI SDK compatibility
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    // 1. Authenticate user (anon key + Bearer token pattern, RLS-safe)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request
    const body = await request.json()
    const { taskId, taskText } = body

    if (!taskId || !taskText) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    // 3. Verify task belongs to user (RLS enforced)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, text, user_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Generate AI answer with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 seconds

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-efficient model
        messages: [
          {
            role: 'system',
            content: RESEARCH_ANSWER_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: taskText
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }, {
        signal: controller.signal
      })

      clearTimeout(timeout)

      const answer = completion.choices[0]?.message?.content || ''
      const tokensUsed = completion.usage?.total_tokens || 0

      // 5. Create note (Story 1.9.4 will handle this)
      // For now, return placeholder noteId
      const noteId = 'placeholder' // Will be replaced in Story 1.9.4

      // 6. Log usage
      console.log('[AI Answer]', {
        userId: user.id,
        taskId,
        tokensUsed,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        answer,
        taskId,
        noteId,
        tokensUsed
      })

    } catch (error) {
      clearTimeout(timeout)

      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout', code: 'TIMEOUT' },
          { status: 408 }
        )
      }

      throw error // Re-throw for outer catch block
    }

  } catch (error) {
    console.error('[AI Answer Error]', error)

    // Handle OpenAI-specific errors
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI rate limit reached', code: 'OPENAI_RATE_LIMIT' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

**System Prompt:**

```typescript
const RESEARCH_ANSWER_SYSTEM_PROMPT = `You are a research assistant helping users answer questions from their personal journals.

Guidelines:
- Provide concise, accurate answers (200-500 words for simple questions, up to 1000 for complex)
- Use markdown formatting (headings, lists, bold, italics) for clarity
- Use citation-style phrasing when appropriate (e.g., "According to recent research..." or "Studies show...")
- Note: Without retrieval, focus on authoritative language patterns rather than verifiable citations
- Acknowledge uncertainty when appropriate (e.g., "This is debated..." or "Evidence suggests...")
- Avoid speculation or hallucination - stick to well-established facts
- Be conversational but informative

Format your response using markdown:
- Use **bold** for key terms
- Use bullet points or numbered lists for clarity
- Use headings (##) to organize longer answers
- Use > blockquotes for citations when appropriate

Example good answer:
## What is Wheeler's "It from Bit" concept?

"It from bit" is a philosophical concept proposed by physicist **John Archibald Wheeler** in the 1980s. The idea suggests that:

- **Information is fundamental**: Physical reality ("it") emerges from binary choices and measurements ("bit")
- **Observer participation**: The universe is participatory - observation and measurement create reality
- **Quantum foundation**: Draws from quantum mechanics, where observation collapses possibilities into actualities

According to Wheeler, "every physical quantity, every it, derives its ultimate significance from bits, binary yes-or-no indications." This connects information theory with quantum physics.

The concept has influenced modern physics, particularly in quantum information theory and the holographic principle.`
```

### Files to Modify

**New Files:**
- `/src/app/api/ai/answer/route.ts` - API route handler

**Environment Variables:**
- `OPENAI_API_KEY` - Already configured in Vercel (from Story 2.4.3)

### Dependencies

- **OpenAI SDK:** Already installed (`npm install openai`)
- **Supabase Auth:** For authentication (anon key + Bearer token pattern)
- **Story 1.9.1:** Requires tasks to have `is_query` field
- **Story 1.9.4:** Will integrate note creation logic

### Error Handling

| Error Type | HTTP Status | Code | User Message |
|------------|-------------|------|--------------|
| Not authenticated | 401 | `AUTH_REQUIRED` | "Please sign in to use this feature" |
| Missing fields | 400 | `INVALID_REQUEST` | "Invalid request. Please try again." |
| Task not found | 404 | `TASK_NOT_FOUND` | "Task not found" |
| OpenAI timeout | 408 | `TIMEOUT` | "Request took too long. Please try again." |
| OpenAI rate limit | 429 | `OPENAI_RATE_LIMIT` | "AI service temporarily unavailable. Try again later." |
| Generic error | 500 | `INTERNAL_ERROR` | "Unable to generate answer. Please try again." |

### Performance Considerations

- **Timeout:** 10-second limit prevents hanging requests
- **Model Selection:** GPT-4o-mini for cost-efficiency (can upgrade to GPT-4o for complex queries in future)
- **Token Limits:** Max 1000 tokens for response (balance quality vs. cost)
- **Streaming:** Consider implementing streaming responses in future for better UX

### Security Considerations

- **Authentication:** Always verify user session before processing
- **Authorization:** Verify task belongs to authenticated user
- **Input Sanitization:** Limit taskText length to prevent abuse
- **Prompt Injection:** System prompt is isolated from user input
- **Rate Limiting:** Handled in Story 1.9.6

### Cost Tracking

- Log `tokensUsed` for each request
- Monitor total daily/monthly token usage
- Calculate costs: GPT-4o-mini ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Set budget alerts in OpenAI dashboard

### Time Estimate

**2-3 days**
- Day 1: API route setup, authentication, OpenAI integration
- Day 2: System prompt design, error handling, timeout logic
- Day 3: Testing, logging, documentation

**Story Points:** 3 points

### References

- **OpenAI Documentation:** https://platform.openai.com/docs/api-reference/chat
- **Supabase Auth Pattern:** Similar to `/src/app/api/tasks/parse/route.ts` (anon key + Bearer token)
- **Node.js Runtime Pattern:** Similar to `/src/app/api/transcribe/route.ts`
- **Existing AI API Route:** `/src/app/api/ontology/analyze/route.ts` (Story 2.4.3)

---

## Dev Agent Record

### Context Reference

<!-- Will be populated during dev-story execution -->

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
