import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { OntologyWritingSparkInput } from '@/lib/ontology/writingSparkAnalysis'

type WritingSparkResponse =
  | { ok: true; text: string; focus: OntologyWritingSparkInput['focus']; signal: OntologyWritingSparkInput['signal'] }
  | { ok: false; error: string }

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

function fallbackSpark(input: OntologyWritingSparkInput): string {
  // Keep it inspirational, question-forward, never “homework”
  const byFocus: Record<OntologyWritingSparkInput['focus'], string> = {
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
  if (input.signal === 'healthy') {
    return "You’ve been building a rich picture of what matters. What feels worth exploring on the page today—right now, as you are?"
  }

  return byFocus[input.focus]
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
        text: fallbackSpark({ focus, signal, context: body.context }),
        focus,
        signal,
      })
    }

    const system = [
      'You write warm, curious writing inspiration for a journaling app.',
      'The user should feel understood and gently invited to write about the right thing for them today.',
      'Never sound like homework, a task list, or psychoanalysis.',
      'Use questions more than statements. Aim for 2–3 sentences total.',
      'Do NOT mention ontology, models, AI, algorithms, gaps, staleness, or timestamps.',
      'Avoid: "you should", "you need to", "before you...", "it has been N days...", "your X is empty/incomplete".',
      '',
      'CRITICAL: When context includes specific values, goals, or mission text:',
      '- Reference 1-2 items BY NAME naturally in your prompt',
      '- Example: "With \'creativity\' among what matters to you, what does it look like to honor that today?"',
      '- AVOID generic phrases like "As you explore the concept of..."',
      '- NEVER invent topics or themes the user hasn\'t expressed interest in',
      '- If the ontology is empty (no context provided), ask open questions about what matters to them',
      '',
      "Echo the user's own language and themes without repeating them verbatim.",
      'Make the prompt feel personally relevant, not generic.',
    ].join('\n')

    // Build rich user prompt with available context
    const contextLines: string[] = []
    const hasContext = !!(
      body.context?.missionExcerpt ||
      body.context?.exampleItems?.length ||
      body.context?.valueNames?.length ||
      body.context?.goalNames?.length ||
      body.context?.recentExcerpt
    )

    if (body.context?.missionExcerpt) {
      contextLines.push(`User's mission: "${body.context.missionExcerpt}"`)
    }
    if (body.context?.valueNames?.length) {
      contextLines.push(`Their values include: ${body.context.valueNames.join(', ')}`)
    }
    if (body.context?.goalNames?.length) {
      contextLines.push(`Their goals include: ${body.context.goalNames.join(', ')}`)
    }
    if (body.context?.exampleItems?.length && focus !== 'values' && focus !== 'goals') {
      // Only show exampleItems if they're different from values/goals (already shown above)
      const itemList = body.context.exampleItems.join(', ')
      contextLines.push(`Their ${focus} include: ${itemList}`)
    }
    if (body.context?.recentExcerpt) {
      contextLines.push(`Something they care about: "${body.context.recentExcerpt}"`)
    }
    if (body.context?.totalItemCount && body.context.totalItemCount > 5) {
      contextLines.push(`They've been actively building their ontology (${body.context.totalItemCount} items across sections)`)
    }

    const instructionLine = hasContext
      ? 'IMPORTANT: Reference at least one specific value, goal, or theme BY NAME in your prompt. Write a warm, personalized writing invitation.'
      : 'The user is just starting out. Write a warm, open-ended question about what matters to them - do NOT invent specific topics.'

    const user = [
      `Focus area: ${focus}`,
      `Signal: ${signal}`,
      contextLines.length > 0 ? `\nContext:\n${contextLines.join('\n')}` : '\nNo context available - ontology is empty.',
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

    const text = completion.choices[0]?.message?.content?.trim() || fallbackSpark({ focus, signal, context: body.context })

    return NextResponse.json<WritingSparkResponse>({ ok: true, text, focus, signal })
  } catch (e) {
    return NextResponse.json<WritingSparkResponse>(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


