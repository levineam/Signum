# Story 1.9.6: Feature Flag and Rate Limiting for AI Answers

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#126](https://github.com/levineam/Signum/issues/126)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a product owner concerned about API costs and feature stability,
I want to control the AI answers feature with a feature flag and rate limits,
so that I can disable the feature or limit usage if costs exceed budget or issues arise.

## Acceptance Criteria

1. **Feature Flag Implementation**
   - [ ] Server-side: Environment variable `ENABLE_AI_ANSWERS` controls API feature availability
   - [ ] Client-side: Environment variable `NEXT_PUBLIC_ENABLE_AI_ANSWERS` controls UI visibility
   - [ ] Feature flag checked in both API and UI
   - [ ] When disabled, "Ask AI" button does not appear on tasks
   - [ ] When disabled, `/api/ai/answer` endpoint returns 403 Forbidden
   - [ ] Feature flag can be changed without code deployment (Vercel env vars)

2. **Rate Limiting**
   - [ ] Per-user rate limit: 10 AI requests per day (configurable via env var)
   - [ ] Rate limit tracked in database or cache (e.g., Redis or Supabase table)
   - [ ] Rate limit resets at midnight UTC
   - [ ] Exceeding rate limit returns 429 Too Many Requests

3. **User Feedback for Rate Limits**
   - [ ] UI shows remaining AI requests (e.g., "5 AI requests left today")
   - [ ] When rate limit reached, "Ask AI" button disabled with tooltip: "Daily limit reached"
   - [ ] API returns clear error message: "Daily AI limit reached. Try again tomorrow."

4. **Admin Configuration**
   - [ ] Rate limit configurable via environment variable: `AI_ANSWER_DAILY_LIMIT`
   - [ ] Feature flags:
     - Server-side: `ENABLE_AI_ANSWERS=true|false` (for API)
     - Client-side: `NEXT_PUBLIC_ENABLE_AI_ANSWERS=true|false` (for UI)
   - [ ] Default values: `ENABLE_AI_ANSWERS=true`, `NEXT_PUBLIC_ENABLE_AI_ANSWERS=true`, `AI_ANSWER_DAILY_LIMIT=10`

5. **Logging and Monitoring**
   - [ ] Log all AI answer requests (user ID, timestamp, success/failure)
   - [ ] Log rate limit hits (user ID, timestamp)
   - [ ] Track total daily/weekly AI requests for cost monitoring

6. **Graceful Degradation**
   - [ ] Disabling feature does not break existing UI
   - [ ] Users with AI-generated notes can still view/edit them
   - [ ] Clear messaging when feature is disabled: "AI answers temporarily unavailable"

## Tasks / Subtasks

- [ ] **Add Environment Variables** (AC: #1, #4)
  - [ ] Add server-side: `ENABLE_AI_ANSWERS=true` to `.env.local` and Vercel env vars
  - [ ] Add client-side: `NEXT_PUBLIC_ENABLE_AI_ANSWERS=true` to `.env.local` and Vercel env vars
  - [ ] Add `AI_ANSWER_DAILY_LIMIT=10` to `.env.local` and Vercel env vars
  - [ ] Document env vars in README or `.env.example`

- [ ] **Implement Feature Flag Check in API** (AC: #1)
  - [ ] Modify `/src/app/api/ai/answer/route.ts`
  - [ ] Check `process.env.ENABLE_AI_ANSWERS === 'true'` at start of handler
  - [ ] Return 403 Forbidden if disabled: `{ error: 'Feature disabled', code: 'FEATURE_DISABLED' }`

- [ ] **Implement Feature Flag Check in UI** (AC: #1, #6)
  - [ ] Create `/src/utils/featureFlags.ts` utility
  - [ ] Export `isAIAnswersEnabled()` function (checks env var or API endpoint)
  - [ ] Modify `/src/components/tasks/AskAIButton.tsx` to check flag before rendering
  - [ ] Show fallback message if disabled: "AI answers temporarily unavailable"

- [ ] **Create Rate Limiting System** (AC: #2)
  - [ ] Option A: Use Supabase table to track requests
    - Create `ai_answer_requests` table with `user_id`, `request_count`, `reset_date`
  - [ ] Option B: Use Vercel Edge Config or Redis (if available)
  - [ ] Implement rate limit check in API route
  - [ ] Increment counter on each request
  - [ ] Reset counter at midnight UTC

- [ ] **Database Schema for Rate Limiting** (AC: #2)
  - [ ] Create migration: `YYYYMMDDHHMMSS_add_ai_answer_rate_limiting.sql`
  - [ ] Create table:
    ```sql
    CREATE TABLE ai_answer_requests (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      request_count INT DEFAULT 0,
      reset_date DATE NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
  - [ ] Add RLS policy: users can only read their own record

- [ ] **Implement Rate Limit Logic** (AC: #2)
  - [ ] Create `/src/utils/rateLimiting.ts` utility
  - [ ] Function: `checkRateLimit(userId: string): Promise<{ allowed: boolean, remaining: number }>`
  - [ ] Increment counter on successful request
  - [ ] Reset counter if `reset_date` is in the past

- [ ] **Add Rate Limit to API** (AC: #2, #3)
  - [ ] Call `checkRateLimit()` in `/src/app/api/ai/answer/route.ts`
  - [ ] Return 429 if limit exceeded: `{ error: 'Daily limit reached', code: 'RATE_LIMIT_EXCEEDED', remaining: 0 }`
  - [ ] Include `remaining` count in success response

- [ ] **Display Remaining Requests in UI** (AC: #3)
  - [ ] Fetch remaining count from API or database
  - [ ] Show in "Ask AI" button tooltip: "5 requests left today"
  - [ ] Disable button when remaining = 0

- [ ] **Add Logging** (AC: #5)
  - [ ] Log AI requests in API route: `console.log('[AI Request]', { userId, taskId, timestamp })`
  - [ ] Log rate limit hits: `console.log('[Rate Limit Hit]', { userId, timestamp })`
  - [ ] Optional: Send logs to monitoring service (e.g., Vercel Analytics, Sentry)

- [ ] **Test Feature Flag Toggle** (AC: #6)
  - [ ] Test with `ENABLE_AI_ANSWERS=false`: button hidden, API returns 403
  - [ ] Test with `ENABLE_AI_ANSWERS=true`: button visible, API works
  - [ ] Verify graceful degradation (no errors when disabled)

- [ ] **Test Rate Limiting** (AC: #2, #3)
  - [ ] Make 10 requests as same user: all succeed
  - [ ] Make 11th request: 429 error
  - [ ] Wait until next day (or manually reset): requests allowed again

## Dev Notes

### Technical Summary

Add a feature flag to enable/disable the AI answers feature globally and implement per-user rate limiting to prevent abuse and control API costs. The system should gracefully handle disabled states and provide clear feedback to users.

### Implementation Approach

**Feature Flag Utility:**

```typescript
// /src/utils/featureFlags.ts
export function isAIAnswersEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AI_ANSWERS === 'true'
}
```

**Rate Limiting Utility:**

```typescript
// /src/utils/rateLimiting.ts
import { createClient } from '@supabase/supabase-js'

const DAILY_LIMIT = parseInt(process.env.AI_ANSWER_DAILY_LIMIT || '10', 10)

interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export async function checkRateLimit(userId: string, token: string): Promise<RateLimitResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Fetch or create rate limit record
  const { data: record, error } = await supabase
    .from('ai_answer_requests')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !record) {
    // Create new record
    await supabase.from('ai_answer_requests').insert({
      user_id: userId,
      request_count: 0,
      reset_date: today,
    })
    return { allowed: true, remaining: DAILY_LIMIT }
  }

  // Check if reset needed
  if (record.reset_date < today) {
    await supabase
      .from('ai_answer_requests')
      .update({ request_count: 0, reset_date: today, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    return { allowed: true, remaining: DAILY_LIMIT }
  }

  // Check limit
  const remaining = DAILY_LIMIT - record.request_count
  const allowed = remaining > 0

  return { allowed, remaining }
}

export async function incrementRateLimit(userId: string, token: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )

  await supabase.rpc('increment_ai_requests', { user_id: userId })
  // Or use:
  // await supabase
  //   .from('ai_answer_requests')
  //   .update({ request_count: record.request_count + 1, updated_at: new Date().toISOString() })
  //   .eq('user_id', userId)
}
```

**Updated API Route with Feature Flag and Rate Limiting:**

```typescript
// /src/app/api/ai/answer/route.ts (modifications)
import { isAIAnswersEnabled } from '@/utils/featureFlags'
import { checkRateLimit, incrementRateLimit } from '@/utils/rateLimiting'

export async function POST(request: Request) {
  try {
    // 1. Check feature flag
    if (!isAIAnswersEnabled()) {
      return NextResponse.json(
        { error: 'AI answers feature is currently disabled', code: 'FEATURE_DISABLED' },
        { status: 403 }
      )
    }

    // 2. Authenticate user (follows /api/tasks/parse pattern)
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
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 3. Check rate limit
    const rateLimitResult = await checkRateLimit(user.id)

    if (!rateLimitResult.allowed) {
      console.log('[Rate Limit Hit]', { userId: user.id, timestamp: new Date().toISOString() })
      return NextResponse.json(
        { error: 'Daily AI limit reached. Try again tomorrow.', code: 'RATE_LIMIT_EXCEEDED', remaining: 0 },
        { status: 429 }
      )
    }

    // ... existing code (validate task, generate AI answer, create note) ...

    // 4. Increment rate limit counter
    await incrementRateLimit(session.user.id)

    // 5. Log request
    console.log('[AI Request]', {
      userId: session.user.id,
      taskId,
      remaining: rateLimitResult.remaining - 1,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      answer,
      taskId,
      noteId: note.id,
      tokensUsed,
      remaining: rateLimitResult.remaining - 1, // Include remaining count
    })

  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Updated AskAIButton with Feature Flag:**

```typescript
// /src/components/tasks/AskAIButton.tsx (modifications)
import { isAIAnswersEnabled } from '@/utils/featureFlags'

export function AskAIButton({ taskId, taskText }: AskAIButtonProps) {
  // ... existing state ...

  // Check feature flag
  if (!isAIAnswersEnabled()) {
    return null // Don't render button if feature disabled
  }

  // ... existing component logic ...
}
```

### Database Schema for Rate Limiting

```sql
-- Migration: YYYYMMDDHHMMSS_add_ai_answer_rate_limiting.sql
CREATE TABLE ai_answer_requests (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INT DEFAULT 0,
  reset_date DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only read their own record
ALTER TABLE ai_answer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limit"
  ON ai_answer_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: Database function for atomic increment
CREATE OR REPLACE FUNCTION increment_ai_requests(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_answer_requests
  SET request_count = request_count + 1,
      updated_at = NOW()
  WHERE ai_answer_requests.user_id = increment_ai_requests.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Files to Modify

**New Files:**
- `/src/utils/featureFlags.ts` - Feature flag utility
- `/src/utils/rateLimiting.ts` - Rate limiting logic
- `/supabase/migrations/YYYYMMDDHHMMSS_add_ai_answer_rate_limiting.sql` - Schema migration

**Modified Files:**
- `/src/app/api/ai/answer/route.ts` - Add feature flag and rate limit checks
- `/src/components/tasks/AskAIButton.tsx` - Check feature flag before rendering
- `.env.local` and `.env.example` - Add env vars

**Environment Variables:**
```bash
# .env.local / .env.example

# Server-side feature flag (checked in API routes)
ENABLE_AI_ANSWERS=true

# Client-side feature flag (checked in UI components)
NEXT_PUBLIC_ENABLE_AI_ANSWERS=true

# Rate limiting
AI_ANSWER_DAILY_LIMIT=10
```

### Dependencies

- **Story 1.9.3 (AI Answer API):** Must be completed first
- **Supabase:** Database for rate limit tracking (using `@supabase/supabase-js` like `/src/app/api/tasks/parse/route.ts`)

### Rate Limiting Alternatives

**Option A: Supabase Table** (Recommended for MVP)
- ✅ Simple to implement
- ✅ No additional services needed
- ❌ Slightly slower than in-memory cache

**Option B: Redis/Upstash**
- ✅ Faster (in-memory)
- ✅ Built-in TTL for auto-reset
- ❌ Requires additional service

**Option C: Vercel Edge Config**
- ✅ Fast, globally distributed
- ❌ Requires Vercel Pro plan
- ❌ More complex setup

### Time Estimate

**1-2 days**
- Day 1: Feature flag implementation, rate limiting logic, database migration
- Day 2: UI updates, testing, logging

**Story Points:** 2 points

### References

- **Feature Flags in Next.js:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Supabase RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security
- **Rate Limiting Patterns:** https://www.patterns.dev/posts/throttling-rate-limiting

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
