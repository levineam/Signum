import { parseDateExpression, type DateParseOptions } from './dateParser';

export interface DetectedTask {
  title: string;
  dueAt: Date | null;
  rrule?: string;
  reason: string;
}

const TASK_KEYWORD_PATTERNS: RegExp[] = [
  /\bremind\s+me(?:\s+to)?\s+(.+)/i,
  /\bi\s+need\s+to\s+(.+)/i,
  /\bneed\s+to\s+(.+)/i,
  /\bi\s+should\s+(.+)/i,
  /\bshould\s+(.+)/i,
  /\bi\s+must\s+(.+)/i,
  /\bmust\s+(.+)/i,
  /\bi\s+want\s+to\s+(.+)/i,
  /\bwant\s+to\s+(.+)/i,
  /\bplan\s+to\s+(.+)/i,
  /\bhave\s+to\s+(.+)/i,
  /\btodo[:\-]?\s*(.+)/i
];

const ACTION_VERBS = [
  'call',
  'email',
  'write',
  'send',
  'schedule',
  'book',
  'buy',
  'pay',
  'follow up',
  'follow-up',
  'finish',
  'complete',
  'submit',
  'review',
  'plan',
  'set up',
  'arrange',
  'remind'
];

const MIN_TITLE_LENGTH = 3;

const sanitizeTitle = (title: string) =>
  title
    .replace(/^to\s+/i, '')
    .replace(/^that\s+/i, '')
    .replace(/^about\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '');

const removeDateFragment = (title: string, dateText?: string) => {
  if (!dateText) {
    return title.trim();
  }

  const escaped = dateText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return title.replace(new RegExp(escaped, 'i'), '').trim();
};

const extractTitleFromKeywords = (paragraphText: string): { title: string; reason: string } | null => {
  for (const pattern of TASK_KEYWORD_PATTERNS) {
    const match = paragraphText.match(pattern);
    if (match && match[1]) {
      return {
        title: match[1],
        reason: `Matched keyword pattern "${pattern.source}"`
      };
    }
  }
  return null;
};

const startsWithActionVerb = (text: string) => {
  const lowered = text.toLowerCase();
  return ACTION_VERBS.some((verb) => lowered.startsWith(verb));
};

export function detectTask(
  paragraphText: string,
  timezoneOffset?: number,
  timezone?: string
): DetectedTask | null {
  if (!paragraphText || typeof paragraphText !== 'string') {
    return null;
  }

  const normalized = paragraphText.trim();
  if (!normalized) {
    return null;
  }

  const parseOptions: DateParseOptions = {
    timezoneOffset,
    timezone
  };

  const dateResult = parseDateExpression(normalized, parseOptions);

  let extracted = extractTitleFromKeywords(normalized);

  if (!extracted && startsWithActionVerb(normalized)) {
    extracted = {
      title: normalized,
      reason: 'Started with action verb'
    };
  }

  if (!extracted && dateResult) {
    extracted = {
      title: normalized,
      reason: 'Contains date expression'
    };
  }

  if (!extracted) {
    return null;
  }

  const cleanedTitle = sanitizeTitle(removeDateFragment(extracted.title, dateResult?.matchedText));

  if (!cleanedTitle || cleanedTitle.length < MIN_TITLE_LENGTH) {
    return null;
  }

  return {
    title: cleanedTitle,
    dueAt: dateResult?.dueAt ?? null,
    rrule: dateResult?.rrule,
    reason: extracted.reason
  };
}
