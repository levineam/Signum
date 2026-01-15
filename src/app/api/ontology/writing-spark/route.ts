import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { OntologyWritingSparkInput, OntologySparkFocus } from '@/lib/ontology/writingSparkAnalysis'
import { getRandomPrompt } from '@/lib/ontology/writingPrompts'

// Feature flag to use pre-written prompts instead of AI-generated ones
const USE_PREWRITTEN_PROMPTS = process.env.USE_PREWRITTEN_PROMPTS === 'true'

type WritingSparkResponse =
  | { ok: true; text: string; focus: OntologyWritingSparkInput['focus']; signal: OntologyWritingSparkInput['signal'] }
  | { ok: false; error: string }

// Focus theme descriptions - tells AI what each focus area is really about
// Used to ensure writing prompts align with the corresponding exercise theme
const FOCUS_THEMES: Record<OntologySparkFocus, string> = {
  'higher-power': 'connection to something larger than oneself - transcendence, meaning, what feels bigger than you, sources of guidance or awe',
  beliefs: 'what they believe to be true about life, themselves, or the world - their worldview, assumptions, and convictions',
  values: 'what matters most to them - their principles, priorities, and what they would fight to protect',
  people: 'relationships and who matters - connection with others, who they want to show up for',
  mission: 'their purpose and the impact they want to have - what they want to be about, the change they want to create',
  goals: 'what they are working toward - their aspirations, aims, and what they are moving toward',
  projects: 'what they are building or creating - their initiatives, meaningful work in progress',
  tasks: 'what needs attention today - their daily actions, focus, and what would make today feel aligned'
}

// Initialize OpenAI client only if API key is available
// 10s timeout prevents hung requests in serverless environments
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10000 })
  : null

function fallbackSpark(
  focus: OntologyWritingSparkInput['focus'],
  signal: OntologyWritingSparkInput['signal']
): string {
  // Keep it inspirational, question-forward, never “homework”
  const byFocus: Record<typeof focus, string> = {
    'higher-power': "What feels bigger than you right now? If you had to name what guides you, what would you call it?",
    beliefs: "What have you been telling yourself lately—about you, other people, or the world? What belief might be worth gently questioning on the page?",
    values: "What's been feeling important to you lately? Sometimes our priorities shift in ways we don't fully notice until we pause to reflect.",
    people: "Who's been on your mind lately? What are you learning about yourself through the people around you?",
    mission: "If you zoom out, what feels like the thread connecting the parts of your life right now? What do you want to be about, even in a small way?",
    goals: "What are you most curious to move toward right now? If you wrote down one aim—just for today—what would it be?",
    projects: "What's one meaningful thing you're building (or wanting to build)? What would it look like to take a small step with clarity?",
    tasks: "What's one small action that would make today feel aligned? What might you do if it could be simple?",
  }

  // For “healthy”, keep it open-ended and light
  if (signal === 'healthy') {
    return "You’ve been building a rich picture of what matters. What feels worth exploring on the page today—right now, as you are?"
  }

  return byFocus[focus]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<OntologyWritingSparkInput>
    const focus = body.focus
    const signal = body.signal

    if (!focus || !signal) {
      return NextResponse.json<WritingSparkResponse>(
        { ok: false, error: 'Missing required fields: focus, signal' },
        { status: 400 }
      )
    }

    // Use pre-written prompts if feature flag is enabled or no AI configured
    if (USE_PREWRITTEN_PROMPTS || !openai) {
      return NextResponse.json<WritingSparkResponse>({
        ok: true,
        text: getRandomPrompt(focus),
        focus,
        signal,
      })
    }

    const focusTheme = FOCUS_THEMES[focus]

    const system = [
      'You write minimal, warm writing prompts for a journaling app.',
      'Keep prompts SHORT: 1-2 sentences maximum.',
      '',
      'CRITICAL RULE: The prompt must be PURELY about the FOCUS THEME.',
      '- Do NOT mention goals, values, or other topics unless they subtly enrich the focus theme.',
      '- Bridge context is optional. If used, it should add texture, not introduce new topics.',
      '- GOOD: "What feels larger than yourself right now?"',
      '- GOOD with bridge: "What feels larger than yourself—beyond even your creative work?"',
      '- BAD: "As you think about your goal X, what feels larger..." (introduces goals as a topic)',
      '',
      'Never mention: ontology, AI, algorithms, timestamps, gaps, staleness.',
      'Avoid: "you should", "you need to", task-like language.',
    ].join('\n')

    // Build rich user prompt with available context
    // Order: Focus theme first, then focus-specific items, then secondary context (values/goals as bridges)
    const focusContextLines: string[] = []
    const secondaryContextLines: string[] = []

    // Focus-specific items come first (exampleItems are from the focus section)
    if (body.context?.exampleItems?.length) {
      const itemList = body.context.exampleItems.join(', ')
      focusContextLines.push(`Their ${focus} include: ${itemList}`)
    }

    // Secondary context - values and goals as potential bridges
    if (body.context?.valueNames?.length && focus !== 'values') {
      secondaryContextLines.push(`(Bridge context) Their values include: ${body.context.valueNames.join(', ')}`)
    }
    if (body.context?.goalNames?.length && focus !== 'goals') {
      secondaryContextLines.push(`(Bridge context) Their goals include: ${body.context.goalNames.join(', ')}`)
    }
    if (body.context?.missionExcerpt && focus !== 'mission') {
      secondaryContextLines.push(`(Bridge context) User's mission: "${body.context.missionExcerpt}"`)
    }
    if (body.context?.recentExcerpt) {
      secondaryContextLines.push(`(Bridge context) Something they care about: "${body.context.recentExcerpt}"`)
    }

    // If focus IS values/goals/mission, include those items in primary context
    if (body.context?.valueNames?.length && focus === 'values') {
      focusContextLines.push(`Their values include: ${body.context.valueNames.join(', ')}`)
    }
    if (body.context?.goalNames?.length && focus === 'goals') {
      focusContextLines.push(`Their goals include: ${body.context.goalNames.join(', ')}`)
    }
    if (body.context?.missionExcerpt && focus === 'mission') {
      focusContextLines.push(`User's mission: "${body.context.missionExcerpt}"`)
    }

    const allContextLines = [...focusContextLines, ...secondaryContextLines]

    const instructionLine = `Write a minimal prompt PURELY about ${focus}. Bridge context is optional—only use it to subtly enrich the focus theme.`

    const user = [
      `FOCUS AREA: ${focus}`,
      `FOCUS THEME: ${focusTheme}`,
      `Signal: ${signal}`,
      allContextLines.length > 0 ? `\nContext:\n${allContextLines.join('\n')}` : '\nNo context available - ontology is empty.',
      '',
      instructionLine,
    ]
      .filter(Boolean)
      .join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.8,
      max_tokens: 120,
    })

    const text = completion.choices[0]?.message?.content?.trim() || fallbackSpark(focus, signal)

    return NextResponse.json<WritingSparkResponse>({ ok: true, text, focus, signal })
  } catch (e) {
    console.error('[writing-spark] Error generating prompt:', e)
    return NextResponse.json<WritingSparkResponse>(
      { ok: false, error: 'Failed to generate writing prompt' },
      { status: 500 }
    )
  }
}
