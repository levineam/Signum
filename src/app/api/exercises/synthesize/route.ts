import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ExerciseSelection, ExerciseType } from '@/types/exercise'

interface SynthesizeRequest {
  exerciseType: ExerciseType
  selections: ExerciseSelection[]
  freeText?: string
  context?: {
    strengths?: string[]
    impact?: string[]
  }
}

type SynthesizeResponse =
  | { ok: true; items: Array<{ name: string; reasoning?: string }> }
  | { ok: false; error: string }

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

function buildPurposeFallback(strengths: string[], impact: string[], freeText?: string) {
  const clean = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  const shorten = (text: string, words: number) => clean(text).split(/\s+/).slice(0, words).join(' ')

  const strength = strengths[0] ?? 'my strengths'
  const impactGroup = impact[0] ?? 'people'

  const first = `Use ${strength} to help ${impactGroup} thrive`
  const secondSeed = freeText ? shorten(freeText, 10) : `create change for ${impactGroup}`
  const second = freeText ? `Create ${secondSeed}` : `Create change for ${impactGroup}`

  return [
    { name: first, reasoning: 'Blends your strengths with who you want to serve.' },
    { name: second, reasoning: 'Reflects the change you described in your own words.' }
  ]
}

function extractJsonArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as Array<{ name: string; reasoning?: string }>
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SynthesizeRequest>
    const exerciseType = body.exerciseType

    if (!exerciseType) {
      return NextResponse.json<SynthesizeResponse>(
        { ok: false, error: 'Missing exerciseType' },
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

    if (exerciseType !== 'purpose') {
      return NextResponse.json<SynthesizeResponse>({ ok: true, items: [] })
    }

    const strengths = body.context?.strengths ?? []
    const impact = body.context?.impact ?? []
    const freeText = body.freeText ?? ''

    if (!openai) {
      return NextResponse.json<SynthesizeResponse>({
        ok: true,
        items: buildPurposeFallback(strengths, impact, freeText)
      })
    }

    const prompt = [
      'Based on a user\'s self-discovery exercises, generate 2-3 personal mission/goal statements.',
      '',
      `User's Inputs:`,
      `- Top Strengths: ${strengths.length ? strengths.join(', ') : 'Not provided'}`,
      `- Who they want to help: ${impact.length ? impact.join(', ') : 'Not provided'}`,
      `- Change they want to create: ${freeText || 'Not provided'}`,
      '',
      'Generate goal statements that:',
      '1. Are actionable and inspiring',
      '2. Combine their strengths with who they want to serve',
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
        items: buildPurposeFallback(strengths, impact, freeText)
      })
    }

    const items = parsed
      .filter((item) => typeof item.name === 'string' && item.name.trim().length > 0)
      .slice(0, 3)
      .map((item) => ({
        name: item.name.trim(),
        reasoning: item.reasoning
      }))

    return NextResponse.json<SynthesizeResponse>({ ok: true, items })
  } catch (error) {
    return NextResponse.json<SynthesizeResponse>(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
