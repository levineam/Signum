/**
 * Date parsing utility for natural language task parsing
 * Story 1.2: Natural Language Task/Reminder Parsing
 *
 * Supports:
 * - Relative dates: "tomorrow", "in 10 days", "next week"
 * - Absolute dates: "Oct 25", "next Fri 8a", "2025-11-01"
 * - Recurring dates: "every Mon", "daily", "every 2 weeks"
 */

import * as chrono from 'chrono-node';
import { RRule, Frequency } from 'rrule';

export interface ParsedDate {
  dueAt: Date;
  rrule?: string;
}

/**
 * Parse natural language date/time from text
 * Returns null if no date detected or confidence is too low
 */
export function parseDate(text: string): ParsedDate | null {
  // Check for recurring patterns first (chrono doesn't handle these)
  const recurringPattern = detectRecurringPattern(text);
  if (recurringPattern) {
    return recurringPattern;
  }

  // Use chrono for one-off dates
  const results = chrono.parse(text, new Date(), { forwardDate: true });

  // No results or low confidence
  if (!results || results.length === 0) {
    return null;
  }

  // Get first result
  const result = results[0];
  const date = result.start.date();

  return { dueAt: date };
}

/**
 * Detect recurring patterns and generate RRULE
 */
function detectRecurringPattern(text: string): ParsedDate | null {
  const lowerText = text.toLowerCase();

  // Daily pattern
  if (lowerText.includes('daily') || lowerText.includes('every day')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9am

    return {
      dueAt: tomorrow,
      rrule: new RRule({
        freq: Frequency.DAILY,
        dtstart: tomorrow
      }).toString()
    };
  }

  // Weekly pattern: "every Monday", "every Mon", etc.
  const weeklyMatch = lowerText.match(/every\s+(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)/);
  if (weeklyMatch) {
    const dayName = weeklyMatch[1];
    const dayIndex = getDayIndex(dayName);
    const nextDate = getNextWeekday(dayIndex);

    return {
      dueAt: nextDate,
      rrule: new RRule({
        freq: Frequency.WEEKLY,
        byweekday: [dayIndex],
        dtstart: nextDate
      }).toString()
    };
  }

  // Weekly interval: "every 2 weeks", "every week"
  const weeklyIntervalMatch = lowerText.match(/every\s+(\d+)?\s*weeks?/);
  if (weeklyIntervalMatch) {
    const interval = weeklyIntervalMatch[1] ? parseInt(weeklyIntervalMatch[1]) : 1;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7 * interval);
    nextWeek.setHours(9, 0, 0, 0);

    return {
      dueAt: nextWeek,
      rrule: new RRule({
        freq: Frequency.WEEKLY,
        interval,
        dtstart: nextWeek
      }).toString()
    };
  }

  // Monthly pattern: "first Monday of month", "every month"
  const firstWeekdayMatch = lowerText.match(/first\s+(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\s+of\s+(the\s+)?month/);
  if (firstWeekdayMatch) {
    const dayName = firstWeekdayMatch[1];
    const dayIndex = getDayIndex(dayName);
    const nextDate = getFirstWeekdayOfNextMonth(dayIndex);

    // Map dayIndex to RRule weekday constants
    const weekdayMap = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
    const rruleWeekday = weekdayMap[dayIndex];

    return {
      dueAt: nextDate,
      rrule: new RRule({
        freq: Frequency.MONTHLY,
        byweekday: [rruleWeekday.nth(1)], // First occurrence of detected weekday
        dtstart: nextDate
      }).toString()
    };
  }

  // Monthly interval: "every month", "every 3 months"
  const monthlyMatch = lowerText.match(/every\s+(\d+)?\s*months?/);
  if (monthlyMatch) {
    const interval = monthlyMatch[1] ? parseInt(monthlyMatch[1]) : 1;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + interval);
    nextMonth.setHours(9, 0, 0, 0);

    return {
      dueAt: nextMonth,
      rrule: new RRule({
        freq: Frequency.MONTHLY,
        interval,
        dtstart: nextMonth
      }).toString()
    };
  }

  return null;
}

/**
 * Get day index (0 = Monday, 6 = Sunday) from day name
 */
function getDayIndex(dayName: string): number {
  const days: Record<string, number> = {
    monday: 0, mon: 0,
    tuesday: 1, tue: 1,
    wednesday: 2, wed: 2,
    thursday: 3, thu: 3,
    friday: 4, fri: 4,
    saturday: 5, sat: 5,
    sunday: 6, sun: 6
  };
  return days[dayName.toLowerCase()] ?? 0;
}

/**
 * Get next occurrence of a weekday
 */
function getNextWeekday(dayIndex: number): Date {
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const daysUntil = (dayIndex - currentDay + 7) % 7 || 7; // If today, use next week

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysUntil);
  nextDate.setHours(9, 0, 0, 0);

  return nextDate;
}

/**
 * Get first occurrence of weekday in current or next month
 * Returns current month's first weekday if it hasn't passed yet,
 * otherwise returns next month's first weekday
 */
function getFirstWeekdayOfNextMonth(dayIndex: number): Date {
  const now = new Date();

  // Try current month first
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDay = (currentMonth.getDay() + 6) % 7;
  const daysUntil = (dayIndex - firstDay + 7) % 7;

  currentMonth.setDate(1 + daysUntil);
  currentMonth.setHours(9, 0, 0, 0);

  // If the first weekday of current month hasn't passed, return it
  if (currentMonth > now) {
    return currentMonth;
  }

  // Otherwise, get first weekday of next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextFirstDay = (nextMonth.getDay() + 6) % 7;
  const nextDaysUntil = (dayIndex - nextFirstDay + 7) % 7;

  nextMonth.setDate(1 + nextDaysUntil);
  nextMonth.setHours(9, 0, 0, 0);

  return nextMonth;
}
