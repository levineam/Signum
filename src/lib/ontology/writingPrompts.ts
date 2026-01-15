import type { OntologyCategory } from '@/types/note'

/**
 * Pre-written writing prompts for each ontology section.
 * These are curated to be:
 * - Warm and inviting, not instructional
 * - Focused purely on the section theme
 * - Short and conversational
 * - Magical, not mechanical
 */
export const WRITING_PROMPTS: Record<OntologyCategory, readonly string[]> = {
  'higher-power': [
    'What feels larger than yourself right now?',
    'When do you feel most connected to something beyond you?',
    'What calls to you from outside your daily concerns?',
    'Where do you sense meaning that transcends your plans?',
    'What would you follow even if no one was watching?',
  ],
  beliefs: [
    'What have you been telling yourself about the world lately?',
    'Which of your assumptions might be worth questioning?',
    'What do you believe that you didn\'t believe a year ago?',
    'What conviction feels most alive in you today?',
    'What truth are you circling but haven\'t quite landed on?',
  ],
  values: [
    'What matters most to you right now?',
    'What would you protect at any cost?',
    'Where are you unwilling to compromise?',
    'What principle is guiding your choices today?',
    'What do you stand for, even when it\'s hard?',
  ],
  people: [
    'Who has been on your mind lately?',
    'What are you learning about yourself through others?',
    'Who do you want to show up better for?',
    'What relationship deserves more of your attention?',
    'Who makes you feel most like yourself?',
  ],
  mission: [
    'What do you want to be about in this world?',
    'What thread connects the different parts of your life?',
    'What impact do you want to leave behind?',
    'What would you do if success was guaranteed?',
    'What keeps pulling you forward?',
  ],
  goals: [
    'What are you moving toward right now?',
    'What would make this season feel complete?',
    'What do you want to be true six months from now?',
    'What are you most curious to pursue?',
    'What aim would make today feel purposeful?',
  ],
  projects: [
    'What are you building that matters to you?',
    'What creative work is calling for your attention?',
    'What would you love to finish?',
    'What project reflects who you\'re becoming?',
    'What are you making that didn\'t exist before?',
  ],
  tasks: [
    'What small action would make today feel aligned?',
    'What needs your attention right now?',
    'What would you do if it could be simple?',
    'What\'s one thing that would create momentum?',
    'What task, if done, would give you peace?',
  ],
}

/**
 * Get a random pre-written prompt for the given ontology focus.
 */
export function getRandomPrompt(focus: OntologyCategory): string {
  const prompts = WRITING_PROMPTS[focus]
  return prompts[Math.floor(Math.random() * prompts.length)]
}
