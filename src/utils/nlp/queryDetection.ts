/**
 * Query detection utility for natural language parsing
 * Story 1.9.1: Query Detection (Rules) for Query-Based Tasks
 *
 * Detects if a task is a research query (can be answered by AI)
 * vs an actionable item (requires user action)
 */

export interface QueryDetectionResult {
  isQuery: boolean;
  confidence: number;
  reason: string;
}

// Interrogative words (strong query signal)
const INTERROGATIVES = [
  'who',
  'what',
  'when',
  'where',
  'why',
  'how',
  'which',
  'whose'
];

// Research keywords (medium query signal)
const RESEARCH_KEYWORDS = [
  'research',
  'find out',
  'look up',
  'learn about',
  'understand',
  'explore',
  'investigate',
  'discover',
  'figure out',
  'know about',
  'find information',
  'get context',
  'read about',
  'study'
];

// Action verbs (strong action signal - negative for query)
const ACTION_VERBS = [
  'call',
  'email',
  'text',
  'message',
  'buy',
  'purchase',
  'order',
  'schedule',
  'book',
  'remind',
  'set up',
  'contact',
  'meet',
  'visit',
  'attend',
  'register',
  'sign up',
  'apply',
  'submit',
  'send',
  'create',
  'make',
  'build',
  'fix',
  'repair',
  'clean',
  'organize',
  'pack',
  'prepare'
];

/**
 * Detect if a task is a research query vs an actionable item
 *
 * Scoring system:
 * - 0.9-1.0: Clear query (multiple signals)
 * - 0.7-0.89: Likely query (one strong signal)
 * - 0.4-0.69: Ambiguous (treat as action)
 * - 0-0.39: Clear action
 *
 * Threshold for query: 0.7+
 *
 * @param taskText - The task text to analyze
 * @returns QueryDetectionResult with isQuery flag, confidence score, and reason
 */
export function detectQuery(taskText: string): QueryDetectionResult {
  if (!taskText || taskText.trim().length < 3) {
    return {
      isQuery: false,
      confidence: 0,
      reason: 'Empty or too short'
    };
  }

  let score = 0.0;
  const reasons: string[] = [];
  const lowerText = taskText.toLowerCase().trim();

  // 1. Interrogative pattern (strong signal: +0.4)
  const startsWithInterrogative = INTERROGATIVES.some(word =>
    new RegExp(`^${word}\\b`, 'i').test(lowerText)
  );
  if (startsWithInterrogative) {
    score += 0.4;
    reasons.push('Starts with interrogative word');
  }

  // 2. Question mark (medium signal: +0.3)
  if (lowerText.includes('?')) {
    score += 0.3;
    reasons.push('Contains question mark');
  }

  // 3. Research keywords (medium signal: +0.3)
  const hasResearchKeyword = RESEARCH_KEYWORDS.some(keyword =>
    lowerText.includes(keyword)
  );
  if (hasResearchKeyword) {
    score += 0.3;
    reasons.push('Contains research keywords');
  }

  // 4. Action verb penalty (strong negative signal: -0.5)
  // Only apply if there's no strong query signal (interrogative or question mark)
  const hasActionVerb = ACTION_VERBS.some(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(lowerText)
  );
  const hasStrongQuerySignal = startsWithInterrogative || lowerText.includes('?');
  if (hasActionVerb && !hasStrongQuerySignal) {
    score -= 0.5;
    reasons.push('Contains action verb');
  }

  // 5. Time/date focus penalty (medium negative signal: -0.3)
  const hasTimeDateFocus = /\b(tomorrow|today|tonight|next week|at \d+|by \d+|this week|next month)\b/i.test(lowerText);
  if (hasTimeDateFocus) {
    score -= 0.3;
    reasons.push('Contains specific time/date');
  }

  // 6. "Find" disambiguation (context-dependent)
  if (lowerText.includes('find')) {
    // "Find my keys" (action) vs "Find information about X" (query)
    const isActionFind = /\bfind\s+(my|the|a|an)\s+\w+\s*$/i.test(lowerText);
    const isQueryFind = /\bfind\s+(information|context|out|details|facts)\b/i.test(lowerText);

    if (isActionFind) {
      score -= 0.2;
      reasons.push('Find used in action context');
    } else if (isQueryFind) {
      score += 0.2;
      reasons.push('Find used in query context');
    }
  }

  // 7. Information-seeking patterns (medium signal: +0.3)
  const infoSeekingPatterns = [
    /what\s+(is|are|does|do)\b/i,
    /how\s+(does|do|can|to)\b/i,
    /why\s+(is|are|does|do)\b/i,
    /\bexplain\b/i,
    /\bmean(ing)?\b/i,
    /\bdefin(e|ition)\b/i
  ];

  const hasInfoSeeking = infoSeekingPatterns.some(pattern =>
    pattern.test(lowerText)
  );
  if (hasInfoSeeking) {
    score += 0.3;
    reasons.push('Information-seeking pattern detected');
  }

  // Normalize score to 0-1 range
  score = Math.max(0, Math.min(1, score));

  // Threshold for query classification: 0.7
  const isQuery = score >= 0.7;

  return {
    isQuery,
    confidence: score,
    reason: reasons.length > 0 ? reasons.join('; ') : 'No strong signals detected'
  };
}

/**
 * Batch detect queries for multiple tasks
 * Useful for processing existing tasks
 *
 * @param tasks - Array of task objects with id and text
 * @returns Array of results with task id and detection result
 */
export function batchDetectQueries(
  tasks: Array<{ id: string; text: string }>
): Array<{ id: string; result: QueryDetectionResult }> {
  return tasks.map(task => ({
    id: task.id,
    result: detectQuery(task.text)
  }));
}
