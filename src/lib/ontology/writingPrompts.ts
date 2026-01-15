import type { OntologyCategory } from '@/types/note'

/**
 * Pre-written writing prompts for each ontology section.
 * Generated using GPT-4o to match the warm, evocative style
 * that resonates with journaling.
 *
 * Style guidelines:
 * - Warm and inviting, not instructional
 * - Focused purely on the section theme
 * - Short and conversational (1-2 sentences)
 * - Magical, not mechanical
 * - No mentions of "should", "need to", or task-like language
 */
export const WRITING_PROMPTS: Record<OntologyCategory, readonly string[]> = {
  'higher-power': [
    'What feels bigger than you—something that grounds you or gives you perspective?',
    'When was the last time you felt connected to something greater than yourself?',
    'What source of meaning or guidance do you turn to when life feels uncertain?',
    'Where do you find a sense of the sacred in your everyday life?',
    'What do you trust in that you can\'t fully explain or control?',
  ],
  beliefs: [
    'What do you believe about yourself that shapes how you move through the world?',
    'What conviction has quietly shifted in you without you noticing?',
    'What do you know in your bones to be true, even if you can\'t prove it?',
    'What belief about life have you been reconsidering lately?',
    'What assumption do you hold that you\'ve never really examined?',
  ],
  values: [
    'What matters most to you right now, even if others don\'t understand?',
    'What principle have you found yourself standing by this week?',
    'If you had to name one thing you\'d never compromise on, what would it be?',
    'What do you value that you wish you expressed more often?',
    'When you feel most aligned with who you want to be, what value are you living?',
  ],
  people: [
    'Whose presence has been lingering in your thoughts lately?',
    'What conversation are you carrying with someone, even when they\'re not here?',
    'Who has surprised you recently with how they showed up?',
    'What are you learning about love through the people in your life right now?',
    'Who do you want to understand more deeply?',
  ],
  mission: [
    'What quiet purpose keeps surfacing, no matter how busy you get?',
    'If your life were telling a story, what would this chapter be about?',
    'What contribution do you find yourself dreaming of making?',
    'What feels like your work to do in this world, even if it\'s unfinished?',
    'What legacy is already taking shape through how you live?',
  ],
  goals: [
    'What are you reaching toward that excites and scares you at the same time?',
    'What would feel like real progress to you right now?',
    'What future self are you quietly becoming?',
    'What aspiration has been whispering to you lately?',
    'What do you want to be able to say you did, when you look back on this time?',
  ],
  projects: [
    'What creative work is calling for your attention right now?',
    'What are you building that feels like it matters?',
    'What project keeps pulling you back, even when you try to ignore it?',
    'What would it feel like to finally bring this idea to life?',
    'What are you making that didn\'t exist before you started?',
  ],
  tasks: [
    'What small action today would create a ripple of meaning?',
    'What needs your attention that you\'ve been gently avoiding?',
    'What would feel like a gift to your future self if you did it now?',
    'What simple thing, if done with care, would change how today feels?',
    'What\'s one thing that would help you feel more at peace by tonight?',
  ],
}

/**
 * Get a random pre-written prompt for the given ontology focus.
 */
export function getRandomPrompt(focus: OntologyCategory): string {
  const prompts = WRITING_PROMPTS[focus]
  return prompts[Math.floor(Math.random() * prompts.length)]
}
