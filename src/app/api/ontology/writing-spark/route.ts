import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { OntologyWritingSparkInput, OntologySparkFocus } from '@/lib/ontology/writingSparkAnalysis'

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

    // No AI configured → return a high-quality fallback (dev/test friendly)
    if (!openai) {
      return NextResponse.json<WritingSparkResponse>({
        ok: true,
        text: fallbackSpark(focus, signal),
        focus,
        signal,
      })
    }

    const focusTheme = FOCUS_THEMES[focus]

    const system = [
      'You write warm, curious writing inspiration for a journaling app.',
      'The user should feel understood and gently invited to write about the right thing for them today.',
      'Never sound like homework, a task list, or psychoanalysis.',
      'Use questions more than statements. Aim for 2–3 sentences total.',
      'Do NOT mention ontology, models, AI, algorithms, gaps, staleness, or timestamps.',
      'Avoid: "you should", "you need to", "before you...", "it has been N days...", "your X is empty/incomplete".',
      '',
      'CRITICAL - FOCUS THEME ALIGNMENT:',
      '- The prompt MUST primarily invite reflection on the FOCUS THEME specified below.',
      '- You may use the user\'s values or goals as bridges INTO the focus theme, but the core invitation must be about the focus area.',
      '- Example for higher-power focus: "With creativity among what matters to you, what feels larger than that—something that calls you beyond yourself?"',
      '- Example for beliefs focus: "Thinking about your goal of career growth, what belief about yourself makes that feel possible—or hard?"',
      '',
      'When context includes specific values, goals, or themes:',
      '- You MAY reference 1-2 items BY NAME as bridges to the focus theme',
      '- But the question itself must be ABOUT the focus theme, not just a general writing prompt',
      '- NEVER invent topics or themes the user hasn\'t expressed interest in',
      '- If the ontology is empty, ask open questions specifically about the focus theme',
      '',
      "Echo the user's own language and themes without repeating them verbatim.",
      'Make the prompt feel personally relevant, not generic.',
    ].join('\n')

    // Build rich user prompt with available context
    // Order: Focus theme first, then focus-specific items, then secondary context (values/goals as bridges)
    const focusContextLines: string[] = []
    const secondaryContextLines: string[] = []

    const hasContext = !!(
      body.context?.missionExcerpt ||
      body.context?.exampleItems?.length ||
      body.context?.valueNames?.length ||
      body.context?.goalNames?.length ||
      body.context?.recentExcerpt
    )

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

    const instructionLine = hasContext
      ? `IMPORTANT: Write a warm, personalized writing invitation that is primarily about ${focus} (${focusTheme}). You may use bridge context items BY NAME to connect to the focus theme.`
      : `The user is just starting out. Write a warm, open-ended question specifically about ${focus} (${focusTheme}) - do NOT invent specific topics.`

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
      model: 'gpt-4o-mini',
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
