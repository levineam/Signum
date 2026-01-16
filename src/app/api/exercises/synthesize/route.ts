import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { hasPublicSupabase } from '@/lib/supabase'
import type { ExerciseSelection, ExerciseType } from '@/types/exercise'

// Auth helper to prevent unauthenticated access (protects OpenAI token usage)
async function requireAuth(request: NextRequest): Promise<{ ok: true } | { ok: false; error: string }> {
  // If Supabase isn't configured, allow the request (uses fallback, no AI tokens)
  if (!hasPublicSupabase()) {
    return { ok: true }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const authHeader = request.headers.get('authorization')
  const [scheme, rawToken] = authHeader?.trim().split(/\s+/) ?? []
  const token = rawToken?.trim()

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return { ok: false, error: 'Unauthorized' }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, error: 'Unauthorized' }
  }

  return { ok: true }
}

interface SynthesizeRequest {
  exerciseType: ExerciseType
  selections: ExerciseSelection[]
  freeText?: string
  context?: {
    values?: string[]
    people?: string[]
  }
}

type SynthesizeResponse =
  | { ok: true; items: Array<{ name: string; reasoning?: string }> }
  | { ok: false; error: string }

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

function buildMissionFallback(values: string[], people: string[], freeText?: string) {
  const clean = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  const shorten = (text: string, words: number) => clean(text).split(/\s+/).slice(0, words).join(' ')

  const value = values[0] ?? 'my values'
  const peopleGroup = people[0] ?? 'people'

  const first = `Live ${value} to help ${peopleGroup} thrive`
  const secondSeed = freeText ? shorten(freeText, 10) : `create change for ${peopleGroup}`
  const second = freeText ? `Create ${secondSeed}` : `Create change for ${peopleGroup}`

  return [
    { name: first, reasoning: 'Blends your values with who matters most to you.' },
    { name: second, reasoning: 'Reflects the change you described in your own words.' }
  ]
}

function extractJsonArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as Array<{ name: string; reasoning?: string }>
  } catch {
    return null
  }
}

// Supported exercise types for synthesis
const SUPPORTED_EXERCISE_TYPES: ExerciseType[] = ['values', 'mission']

export async function POST(request: NextRequest) {
  // Require authentication to prevent unauthorized OpenAI token usage
  const authResult = await requireAuth(request)
  if (!authResult.ok) {
    return NextResponse.json<SynthesizeResponse>(
      { ok: false, error: authResult.error },
      { status: 401 }
    )
  }

  // Parse JSON body with explicit error handling for invalid JSON
  let body: Partial<SynthesizeRequest>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<SynthesizeResponse>(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  try {
    const exerciseType = body.exerciseType

    if (!exerciseType) {
      return NextResponse.json<SynthesizeResponse>(
        { ok: false, error: 'Missing exerciseType' },
        { status: 400 }
      )
    }

    // Validate exercise type is supported for synthesis
    if (!SUPPORTED_EXERCISE_TYPES.includes(exerciseType)) {
      return NextResponse.json<SynthesizeResponse>(
        { ok: false, error: `Unsupported exercise type for synthesis: ${exerciseType}. Supported types: ${SUPPORTED_EXERCISE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (exerciseType === 'values') {
      const selections = body.selections ?? []
      if (!selections.length) {
        return NextResponse.json<SynthesizeResponse>(
          { ok: false, error: 'No selections provided' },
          { status: 400 }
        )
      }

      return NextResponse.json<SynthesizeResponse>({
        ok: true,
        items: selections.map((item) => ({ name: item.name }))
      })
    }

    // At this point, exerciseType must be 'mission' (validated above)
    const values = body.context?.values ?? []
    const people = body.context?.people ?? []
    const freeText = body.freeText ?? ''

    if (!openai) {
      return NextResponse.json<SynthesizeResponse>({
        ok: true,
        items: buildMissionFallback(values, people, freeText)
      })
    }

    const prompt = [
      'Based on a user\'s self-discovery exercises, generate 2-3 personal mission/goal statements.',
      '',
      `User's Inputs:`,
      `- Core Values: ${values.length ? values.join(', ') : 'Not provided'}`,
      `- Who matters most to them: ${people.length ? people.join(', ') : 'Not provided'}`,
      `- Change they want to create: ${freeText || 'Not provided'}`,
      '',
      'Generate goal statements that:',
      '1. Are actionable and inspiring',
      '2. Combine their values with who matters most to them',
      '3. Feel personal (not generic)',
      '4. Are 5-15 words each',
      '',
      'Return as JSON: [{ "name": "Goal statement", "reasoning": "Why this fits" }]'
    ].join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write concise, personal mission statements. Only return valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ''
    const parsed = extractJsonArray(content)

    if (!parsed || !parsed.length) {
      return NextResponse.json<SynthesizeResponse>({
        ok: true,
        items: buildMissionFallback(values, people, freeText)
      })
    }

    const items = parsed
      .filter((item) => typeof item.name === 'string' && item.name.trim().length > 0)
      .slice(0, 3)
      .map((item) => ({
        name: item.name.trim(),
        reasoning: item.reasoning
      }))

    // If all items were filtered out (e.g., empty names), use fallback
    if (!items.length) {
      return NextResponse.json<SynthesizeResponse>({
        ok: true,
        items: buildMissionFallback(values, people, freeText)
      })
    }

    return NextResponse.json<SynthesizeResponse>({ ok: true, items })
  } catch (error) {
    console.error('[synthesize] Unexpected error:', error)
    return NextResponse.json<SynthesizeResponse>(
      { ok: false, error: 'Unknown error' },
      { status: 500 }
    )
  }
}
