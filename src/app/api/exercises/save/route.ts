import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hasPublicSupabase } from '@/lib/supabase'
import {
  DEFAULT_EXERCISE_COMPLETION,
  type ExerciseResult,
  type ExerciseSelection,
  type ExerciseType,
} from '@/types/exercise'

interface SaveExerciseRequest {
  exerciseType: ExerciseType
  selections: ExerciseSelection[]
  freeText?: string
  completedAt?: string
}

type SaveExerciseResponse =
  | { ok: true; result: ExerciseResult }
  | { ok: false; error: string }

type CompletionResponse =
  | { ok: true; status: Record<ExerciseType, boolean> }
  | { ok: false; error: string }

// Database row type for exercise_results table
interface ExerciseResultRow {
  id: string
  user_id: string
  exercise_type: ExerciseType
  selections: ExerciseSelection[]
  free_text: string | null
  completed_at: string
  version: number
  generated_items?: Array<{ noteId: string; itemName: string }> | null
}

// Max retries for version conflict (rare race condition)
const MAX_VERSION_RETRIES = 3

function getSupabaseClient(token?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  })
}

async function requireUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const [scheme, rawToken] = authHeader?.trim().split(/\s+/) ?? []
  const token = rawToken?.trim()

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    throw new Error('AUTH_REQUIRED')
  }

  const supabase = getSupabaseClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('AUTH_REQUIRED')
  }

  return { supabase, user }
}

export async function POST(request: NextRequest) {
  if (!hasPublicSupabase()) {
    return new Response('Supabase not configured', { status: 503 })
  }

  // Parse JSON body with explicit error handling for invalid JSON
  let body: SaveExerciseRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<SaveExerciseResponse>(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  try {
    const { supabase, user } = await requireUser(request)

    if (!body.exerciseType || !Array.isArray(body.selections)) {
      return NextResponse.json<SaveExerciseResponse>(
        { ok: false, error: 'Missing required fields: exerciseType, selections' },
        { status: 400 }
      )
    }

    // Retry loop to handle version race conditions
    // If a unique constraint on (user_id, exercise_type, version) exists,
    // concurrent requests may collide. We retry with a fresh version number.
    let data: ExerciseResultRow | null = null
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_VERSION_RETRIES; attempt++) {
      // Order by version (not completed_at) to ensure monotonic versioning
      // even if a client sends a backdated completedAt
      const { data: latest, error: latestError } = await supabase
        .from('exercise_results')
        .select('version')
        .eq('user_id', user.id)
        .eq('exercise_type', body.exerciseType)
        .order('version', { ascending: false })
        .limit(1)

      if (latestError) {
        return NextResponse.json<SaveExerciseResponse>(
          { ok: false, error: latestError.message },
          { status: 500 }
        )
      }

      const nextVersion = ((latest as Array<{ version: number }> | null)?.[0]?.version ?? 0) + 1

      const payload = {
        user_id: user.id,
        exercise_type: body.exerciseType,
        selections: body.selections,
        free_text: body.freeText ?? null,
        completed_at: body.completedAt ?? new Date().toISOString(),
        version: nextVersion
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('exercise_results')
        .insert(payload)
        .select('*')
        .single()

      if (!insertError && insertedData) {
        data = insertedData as ExerciseResultRow
        break
      }

      // Check if this is a unique constraint violation (version conflict)
      // Postgres error code 23505 = unique_violation
      const isVersionConflict =
        insertError?.code === '23505' ||
        insertError?.message?.toLowerCase().includes('unique') ||
        insertError?.message?.toLowerCase().includes('duplicate')

      if (isVersionConflict && attempt < MAX_VERSION_RETRIES - 1) {
        // Retry with fresh version
        lastError = new Error(insertError?.message ?? 'Version conflict')
        continue
      }

      // Non-retryable error or max retries exceeded
      return NextResponse.json<SaveExerciseResponse>(
        { ok: false, error: insertError?.message ?? 'Failed to save result' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json<SaveExerciseResponse>(
        { ok: false, error: lastError?.message ?? 'Failed to save result after retries' },
        { status: 500 }
      )
    }

    const result: ExerciseResult = {
      id: data.id,
      userId: data.user_id,
      exerciseType: data.exercise_type,
      selections: data.selections ?? [],
      freeText: data.free_text ?? undefined,
      completedAt: data.completed_at,
      version: data.version,
      generatedItems: data.generated_items ?? undefined
    }

    return NextResponse.json<SaveExerciseResponse>({ ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'AUTH_REQUIRED' ? 401 : 500
    return NextResponse.json<SaveExerciseResponse>(
      { ok: false, error: message === 'AUTH_REQUIRED' ? 'Unauthorized' : message },
      { status }
    )
  }
}

export async function GET(request: NextRequest) {
  if (!hasPublicSupabase()) {
    return new Response('Supabase not configured', { status: 503 })
  }

  try {
    const { supabase, user } = await requireUser(request)

    const { data, error } = await supabase
      .from('exercise_results')
      .select('exercise_type')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json<CompletionResponse>(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    const status = { ...DEFAULT_EXERCISE_COMPLETION }
    ;(data as Array<{ exercise_type: ExerciseType }> | null)?.forEach((row) => {
      if (row.exercise_type in status) {
        status[row.exercise_type] = true
      }
    })

    return NextResponse.json<CompletionResponse>({ ok: true, status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const httpStatus = message === 'AUTH_REQUIRED' ? 401 : 500
    return NextResponse.json<CompletionResponse>(
      { ok: false, error: message === 'AUTH_REQUIRED' ? 'Unauthorized' : message },
      { status: httpStatus }
    )
  }
}
