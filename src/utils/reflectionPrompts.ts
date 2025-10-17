/**
 * Reflection Prompts Utility
 * Issue #18: Renamed from journalPrompts.ts
 *
 * ACT-inspired reflection prompts with rotation logic.
 * Used by the ReflectionPromptHelper component.
 */

export const REFLECTION_PROMPTS = [
  // Values-Focused
  "What value do you most want to live by today?",
  "How can you bring more vitality and meaning into your day?",
  "What would it look like to stay true to what matters most today?",

  // Mindfulness & Present Moment
  "What sensations are you noticing in your body as you begin your day?",
  "What sound can you hear right now if you pause and listen closely?",
  "What is one detail in your environment you can notice this morning that you usually overlook?",

  // Committed Action
  "What is one small step you can take today that your future self would thank you for?",
  "What challenge might arise today, and what valued action could you choose in response?",
  "What is one thing you can do today to move a little closer to the life you want?",

  // Cognitive Defusion
  "What story is your mind already telling you about the day ahead?",
  "If you gave this morning's worry a shape and color, what would it be?",
  "What thought might get in your way today, and how can you notice it without letting it control you?"
];

export function getNextPrompt(): string {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') return REFLECTION_PROMPTS[0];

  const lastIndex = parseInt(localStorage.getItem('reflection-prompt-index') || '-1');
  const nextIndex = (lastIndex + 1) % REFLECTION_PROMPTS.length;
  localStorage.setItem('reflection-prompt-index', nextIndex.toString());

  return REFLECTION_PROMPTS[nextIndex];
}

export function getCurrentPrompt(): string {
  if (typeof window === 'undefined') return REFLECTION_PROMPTS[0];

  const currentIndex = parseInt(localStorage.getItem('reflection-prompt-index') || '0');
  return REFLECTION_PROMPTS[currentIndex];
}

export function resetPromptRotation(): void {
  localStorage.removeItem('reflection-prompt-index');
}

// Legacy exports for backward compatibility (Issue #18)
export const JOURNAL_PROMPTS = REFLECTION_PROMPTS;
