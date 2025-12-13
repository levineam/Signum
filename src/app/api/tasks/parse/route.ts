import { NextRequest, NextResponse } from 'next/server'
import { hasPublicSupabase } from '@/lib/supabase'

const TEST_MODE = ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

/**
 * POST /api/tasks/parse
 *
 * NOTE: In test-mode or when Supabase env vars are missing, we return a no-op
 * response so the UI doesn't spam errors (task detection is optional UX).
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const paragraphText =
    typeof (body as { paragraphText?: unknown })?.paragraphText === 'string'
      ? (body as { paragraphText: string }).paragraphText.trim()
      : ''

  // No-op cases: empty input, oversized input, or local-only mode.
  if (!paragraphText || paragraphText.length > 1000 || TEST_MODE || !hasPublicSupabase()) {
    return NextResponse.json({ task: null }, { status: 200 })
  }

  // Phase 5 will implement task parsing + persistence.
  return NextResponse.json({ task: null }, { status: 200 })
}

