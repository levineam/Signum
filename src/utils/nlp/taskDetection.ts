/**
 * Task detection utility for natural language parsing
 * Story 1.2: Natural Language Task/Reminder Parsing
 *
 * Detects tasks in paragraphs and extracts:
 * - Task title
 * - Due date (if present)
 * - Recurrence rule (if applicable)
 */

import { parseDate } from './dateParser';

export interface DetectedTask {
  title: string;
  dueAt: Date | null;
  rrule?: string;
}

// Task indicator keywords
const TASK_KEYWORDS = [
  'remind me',
  'reminder',
  'todo',
  'to-do',
  'task',
  'need to',
  'should',
  'must',
  'want to',
  'plan to',
  'have to',
  'got to',
  'gotta'
];

/**
 * Detect if paragraph contains a task and extract details
 * Returns null if no task detected
 *
 * @param paragraphText - The text to analyze for task keywords
 * @param timezoneOffsetMinutes - User's timezone offset in minutes (from Date.getTimezoneOffset())
 * @param timezone - IANA timezone ID for DST-aware date parsing
 */
export function detectTask(
  paragraphText: string,
  timezoneOffsetMinutes?: number,
  timezone?: string
): DetectedTask | null {
  if (!paragraphText || paragraphText.trim().length < 3) {
    return null;
  }

  const lowerText = paragraphText.toLowerCase().trim();

  // Check if any task keyword is present
  const hasTaskKeyword = TASK_KEYWORDS.some(keyword => lowerText.includes(keyword));
  if (!hasTaskKeyword) {
    return null;
  }

  // Extract task title
  const title = extractTaskTitle(paragraphText);
  if (!title || title.length < 3) {
    return null;
  }

  // Parse date from paragraph (with DST-aware timezone handling)
  const parsedDate = parseDate(paragraphText, timezoneOffsetMinutes, timezone);

  return {
    title,
    dueAt: parsedDate?.dueAt || null,
    rrule: parsedDate?.rrule
  };
}

/**
 * Extract task title from paragraph text
 */
function extractTaskTitle(originalText: string): string {
  // Pattern 1: "remind me to [TITLE]"
  const remindMeMatch = originalText.match(/remind\s+me\s+to\s+([^.!?\n]+)/i);
  if (remindMeMatch) {
    return cleanTitle(remindMeMatch[1]);
  }

  // Pattern 2: "I need to [TITLE]" or "need to [TITLE]"
  const needToMatch = originalText.match(/(?:I\s+)?need\s+to\s+([^.!?\n]+)/i);
  if (needToMatch) {
    return cleanTitle(needToMatch[1]);
  }

  // Pattern 3: "I should [TITLE]" or "should [TITLE]"
  const shouldMatch = originalText.match(/(?:I\s+)?should\s+([^.!?\n]+)/i);
  if (shouldMatch) {
    return cleanTitle(shouldMatch[1]);
  }

  // Pattern 4: "I must [TITLE]" or "must [TITLE]"
  const mustMatch = originalText.match(/(?:I\s+)?must\s+([^.!?\n]+)/i);
  if (mustMatch) {
    return cleanTitle(mustMatch[1]);
  }

  // Pattern 5: "I want to [TITLE]" or "want to [TITLE]"
  const wantToMatch = originalText.match(/(?:I\s+)?want\s+to\s+([^.!?\n]+)/i);
  if (wantToMatch) {
    return cleanTitle(wantToMatch[1]);
  }

  // Pattern 6: "I plan to [TITLE]" or "plan to [TITLE]"
  const planToMatch = originalText.match(/(?:I\s+)?plan\s+to\s+([^.!?\n]+)/i);
  if (planToMatch) {
    return cleanTitle(planToMatch[1]);
  }

  // Pattern 7: "I have to [TITLE]" or "have to [TITLE]"
  const haveToMatch = originalText.match(/(?:I\s+)?have\s+to\s+([^.!?\n]+)/i);
  if (haveToMatch) {
    return cleanTitle(haveToMatch[1]);
  }

  // Pattern 8: "I got to [TITLE]" or "I gotta [TITLE]"
  const gottaMatch = originalText.match(/(?:I\s+)?(?:got\s+to|gotta)\s+([^.!?\n]+)/i);
  if (gottaMatch) {
    return cleanTitle(gottaMatch[1]);
  }

  // Pattern 9: "todo: [TITLE]" or "to-do: [TITLE]"
  const todoMatch = originalText.match(/(?:todo|to-do):\s*([^.!?\n]+)/i);
  if (todoMatch) {
    return cleanTitle(todoMatch[1]);
  }

  // Pattern 10: "task: [TITLE]"
  const taskMatch = originalText.match(/task:\s*([^.!?\n]+)/i);
  if (taskMatch) {
    return cleanTitle(taskMatch[1]);
  }

  // Pattern 11: "reminder: [TITLE]"
  const reminderMatch = originalText.match(/reminder:\s*([^.!?\n]+)/i);
  if (reminderMatch) {
    return cleanTitle(reminderMatch[1]);
  }

  // Fallback: use entire text as title (after removing task keyword)
  return cleanTitle(originalText);
}

/**
 * Clean extracted title by removing date phrases and extra whitespace
 */
function cleanTitle(title: string): string {
  // Remove common date phrases
  let cleaned = title
    .replace(/\b(tomorrow|today|tonight)\b/gi, '')
    .replace(/\bin\s+\d+\s+(hours?|days?|weeks?|months?|years?)\b/gi, '')
    .replace(/\bnext\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
    .replace(/\bevery\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
    .replace(/\bevery\s+\d+\s+(weeks?|months?|days?)\b/gi, '')
    .replace(/\b(daily|weekly|monthly)\b/gi, '')
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\b/gi, '')
    .replace(/\bfirst\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+of\s+(the\s+)?month\b/gi, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '');

  // Remove trailing punctuation and whitespace
  cleaned = cleaned
    .replace(/[.!?,;]+$/, '')
    .trim();

  return cleaned;
}
