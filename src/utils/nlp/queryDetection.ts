export interface QueryDetectionResult {
  isQuery: boolean;
  confidence: number;
  reason: string;
}

const INTERROGATIVE_REGEX = /^(who|what|when|where|why|how|which|whom)\b/i;
const QUESTION_MARK_REGEX = /\?/;

const RESEARCH_KEYWORDS = [
  'research',
  'find out',
  'look up',
  'learn about',
  'understand',
  'figure out',
  'discover',
  'investigate',
  'explore',
  'explain'
];

const ACTION_VERBS = [
  'call',
  'email',
  'buy',
  'purchase',
  'schedule',
  'remind',
  'set up',
  'contact',
  'visit',
  'follow up',
  'submit',
  'complete'
];

const TIME_PHRASES = /(today|tomorrow|next\s+(week|month)|at\s+\d|by\s+\d|\d{1,2}:\d{2})/i;

export function detectQuery(text: string): QueryDetectionResult {
  if (!text || typeof text !== 'string') {
    return { isQuery: false, confidence: 0, reason: 'Empty text' };
  }

  const normalized = text.trim();
  let score = 0;
  const reasons: string[] = [];

  if (INTERROGATIVE_REGEX.test(normalized)) {
    score += 0.4;
    reasons.push('Starts with interrogative word');
  }

  if (QUESTION_MARK_REGEX.test(normalized)) {
    score += 0.3;
    reasons.push('Contains question mark');
  }

  if (RESEARCH_KEYWORDS.some((keyword) => normalized.toLowerCase().includes(keyword))) {
    score += 0.3;
    reasons.push('Contains research keyword');
  }

  if (ACTION_VERBS.some((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(normalized))) {
    score -= 0.5;
    reasons.push('Contains action verb');
  }

  if (TIME_PHRASES.test(normalized)) {
    score -= 0.3;
    reasons.push('Mentions concrete time/date');
  }

  // Penalize very short statements that look like commands
  if (normalized.split(' ').length <= 3 && !QUESTION_MARK_REGEX.test(normalized)) {
    score -= 0.2;
    reasons.push('Very short directive text');
  }

  score = Math.max(0, Math.min(1, score));

  return {
    isQuery: score >= 0.7,
    confidence: score,
    reason: reasons.join('; ') || 'No query indicators'
  };
}
