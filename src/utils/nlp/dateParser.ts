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
 *
 * @param text - The text to parse for dates
 * @param timezoneOffsetMinutes - User's timezone offset in minutes (from Date.getTimezoneOffset())
 *                                Positive values are west of UTC, negative values are east of UTC
 * @param timezone - IANA timezone ID (e.g., "America/New_York") for accurate DST handling
 */
export function parseDate(
  text: string,
  timezoneOffsetMinutes?: number,
  timezone?: string
): ParsedDate | null {
  // Check for recurring patterns first (chrono doesn't handle these)
  const recurringPattern = detectRecurringPattern(text, timezoneOffsetMinutes, timezone);
  if (recurringPattern) {
    return recurringPattern;
  }

  // Create a reference date in the user's timezone
  const referenceDate = getReferenceDate(timezoneOffsetMinutes);

  // Use chrono for one-off dates
  const results = chrono.parse(text, referenceDate, { forwardDate: true });

  // No results or low confidence
  if (!results || results.length === 0) {
    return null;
  }

  // Get first result
  const result = results[0];
  const date = result.start.date();

  // Adjust the parsed date to the user's timezone
  // Chrono parses "8am" as 8am in the server's timezone, but we want 8am in the user's timezone
  const adjustedDate = adjustDateToUserTimezone(date, timezoneOffsetMinutes, timezone);

  return { dueAt: adjustedDate };
}

/**
 * Get a reference date in the user's timezone
 * If no timezone offset is provided, use server time
 */
function getReferenceDate(timezoneOffsetMinutes?: number): Date {
  if (timezoneOffsetMinutes === undefined) {
    return new Date();
  }

  // Create a date adjusted for the user's timezone
  // getTimezoneOffset() returns positive values for west of UTC
  const now = new Date();
  const serverOffset = now.getTimezoneOffset();
  const offsetDiff = serverOffset - timezoneOffsetMinutes;

  return new Date(now.getTime() + offsetDiff * 60 * 1000);
}

/**
 * Adjust a date from server timezone to user timezone
 * This ensures that "8am" in the user's timezone is stored correctly as UTC
 *
 * @param date - The date to adjust
 * @param timezoneOffsetMinutes - Current timezone offset (fallback if timezone ID not provided)
 * @param timezone - IANA timezone ID for accurate DST-aware offset calculation
 */
function adjustDateToUserTimezone(
  date: Date,
  timezoneOffsetMinutes?: number,
  timezone?: string
): Date {
  if (timezoneOffsetMinutes === undefined) {
    return date;
  }

  // If we have a timezone ID, calculate the offset FOR THE TARGET DATE
  // This handles DST transitions correctly (e.g., parsing "December 1" in July)
  let targetOffset = timezoneOffsetMinutes;
  if (timezone) {
    try {
      // Get the offset at the target date using Intl API
      targetOffset = getTimezoneOffsetForDate(date, timezone);
    } catch (err) {
      // Fall back to current offset if timezone is invalid
      console.warn('[dateParser] Invalid timezone, using current offset:', timezone, err);
    }
  }

  const serverOffset = new Date().getTimezoneOffset();
  const offsetDiff = serverOffset - targetOffset;
  return new Date(date.getTime() - offsetDiff * 60 * 1000);
}

/**
 * Get timezone offset in minutes for a specific date in a specific timezone
 * Uses Intl.DateTimeFormat to handle DST transitions correctly
 *
 * @param date - The target date
 * @param timezone - IANA timezone ID (e.g., "America/New_York")
 * @returns Offset in minutes (positive = west of UTC)
 */
function getTimezoneOffsetForDate(date: Date, timezone: string): number {
  // Format the date in the target timezone and in UTC
  const targetFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  });

  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });

  // Parse formatted strings to get time in milliseconds
  const targetTime = new Date(targetFormatter.format(date)).getTime();
  const utcTime = new Date(utcFormatter.format(date)).getTime();

  // Calculate offset in minutes
  // Negate to match Date.getTimezoneOffset() convention: positive = west of UTC
  return (utcTime - targetTime) / (1000 * 60);
}

/**
 * Extract time of day from text using chrono
 * Returns { hour, minute } if found, otherwise null
 */
function extractTimeFromText(text: string, timezoneOffsetMinutes?: number): { hour: number; minute: number } | null {
  const referenceDate = getReferenceDate(timezoneOffsetMinutes);
  const results = chrono.parse(text, referenceDate, { forwardDate: true });

  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0];

  // Check if the parsed result includes a time component
  if (result.start.get('hour') !== null && result.start.get('hour') !== undefined) {
    const hour = result.start.get('hour') || 0;
    const minute = result.start.get('minute') || 0;
    return { hour, minute };
  }

  return null;
}

/**
 * Detect recurring patterns and generate RRULE
 */
function detectRecurringPattern(
  text: string,
  timezoneOffsetMinutes?: number,
  timezone?: string
): ParsedDate | null {
  const lowerText = text.toLowerCase();

  // Daily pattern
  if (lowerText.includes('daily') || lowerText.includes('every day')) {
    const referenceDate = getReferenceDate(timezoneOffsetMinutes);
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Try to extract explicit time from text, otherwise default to 9am
    const timeInfo = extractTimeFromText(text, timezoneOffsetMinutes);
    if (timeInfo) {
      tomorrow.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
    } else {
      tomorrow.setHours(9, 0, 0, 0); // Default to 9am
    }

    // Adjust to user's timezone (with DST-aware offset calculation)
    const adjustedDate = adjustDateToUserTimezone(tomorrow, timezoneOffsetMinutes, timezone);

    return {
      dueAt: adjustedDate,
      rrule: new RRule({
        freq: Frequency.DAILY,
        dtstart: adjustedDate
      }).toString()
    };
  }

  // Weekly pattern: "every Monday", "every Mon", etc.
  const weeklyMatch = lowerText.match(/every\s+(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)/);
  if (weeklyMatch) {
    const dayName = weeklyMatch[1];
    const dayIndex = getDayIndex(dayName);
    const referenceDate = getReferenceDate(timezoneOffsetMinutes);

    // Try to extract explicit time from text, otherwise default to 9am
    const timeInfo = extractTimeFromText(text, timezoneOffsetMinutes);
    const nextDate = getNextWeekday(dayIndex, referenceDate, timeInfo);

    // Adjust to user's timezone (with DST-aware offset calculation)
    const adjustedDate = adjustDateToUserTimezone(nextDate, timezoneOffsetMinutes, timezone);

    return {
      dueAt: adjustedDate,
      rrule: new RRule({
        freq: Frequency.WEEKLY,
        byweekday: [dayIndex],
        dtstart: adjustedDate
      }).toString()
    };
  }

  // Weekly interval: "every 2 weeks", "every week"
  const weeklyIntervalMatch = lowerText.match(/every\s+(\d+)?\s*weeks?/);
  if (weeklyIntervalMatch) {
    const interval = weeklyIntervalMatch[1] ? parseInt(weeklyIntervalMatch[1]) : 1;
    const referenceDate = getReferenceDate(timezoneOffsetMinutes);
    const nextWeek = new Date(referenceDate);
    nextWeek.setDate(nextWeek.getDate() + 7 * interval);

    // Try to extract explicit time from text, otherwise default to 9am
    const timeInfo = extractTimeFromText(text, timezoneOffsetMinutes);
    if (timeInfo) {
      nextWeek.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
    } else {
      nextWeek.setHours(9, 0, 0, 0);
    }

    // Adjust to user's timezone (with DST-aware offset calculation)
    const adjustedDate = adjustDateToUserTimezone(nextWeek, timezoneOffsetMinutes, timezone);

    return {
      dueAt: adjustedDate,
      rrule: new RRule({
        freq: Frequency.WEEKLY,
        interval,
        dtstart: adjustedDate
      }).toString()
    };
  }

  // Monthly pattern: "first Monday of month", "every month"
  const firstWeekdayMatch = lowerText.match(/first\s+(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\s+of\s+(the\s+)?month/);
  if (firstWeekdayMatch) {
    const dayName = firstWeekdayMatch[1];
    const dayIndex = getDayIndex(dayName);
    const referenceDate = getReferenceDate(timezoneOffsetMinutes);

    // Try to extract explicit time from text, otherwise default to 9am
    const timeInfo = extractTimeFromText(text, timezoneOffsetMinutes);
    const nextDate = getFirstWeekdayOfNextMonth(dayIndex, referenceDate, timeInfo);

    // Adjust to user's timezone (with DST-aware offset calculation)
    const adjustedDate = adjustDateToUserTimezone(nextDate, timezoneOffsetMinutes, timezone);

    // Map dayIndex to RRule weekday constants
    const weekdayMap = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
    const rruleWeekday = weekdayMap[dayIndex];

    return {
      dueAt: adjustedDate,
      rrule: new RRule({
        freq: Frequency.MONTHLY,
        byweekday: [rruleWeekday.nth(1)], // First occurrence of detected weekday
        dtstart: adjustedDate
      }).toString()
    };
  }

  // Monthly interval: "every month", "every 3 months"
  const monthlyMatch = lowerText.match(/every\s+(\d+)?\s*months?/);
  if (monthlyMatch) {
    const interval = monthlyMatch[1] ? parseInt(monthlyMatch[1]) : 1;
    const referenceDate = getReferenceDate(timezoneOffsetMinutes);
    const nextMonth = new Date(referenceDate);
    nextMonth.setMonth(nextMonth.getMonth() + interval);

    // Try to extract explicit time from text, otherwise default to 9am
    const timeInfo = extractTimeFromText(text, timezoneOffsetMinutes);
    if (timeInfo) {
      nextMonth.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
    } else {
      nextMonth.setHours(9, 0, 0, 0);
    }

    // Adjust to user's timezone (with DST-aware offset calculation)
    const adjustedDate = adjustDateToUserTimezone(nextMonth, timezoneOffsetMinutes, timezone);

    return {
      dueAt: adjustedDate,
      rrule: new RRule({
        freq: Frequency.MONTHLY,
        interval,
        dtstart: adjustedDate
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
function getNextWeekday(
  dayIndex: number,
  referenceDate: Date = new Date(),
  timeInfo?: { hour: number; minute: number } | null
): Date {
  const currentDay = (referenceDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const daysUntil = (dayIndex - currentDay + 7) % 7 || 7; // If today, use next week

  const nextDate = new Date(referenceDate);
  nextDate.setDate(nextDate.getDate() + daysUntil);

  // Use provided time or default to 9am
  if (timeInfo) {
    nextDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
  } else {
    nextDate.setHours(9, 0, 0, 0);
  }

  return nextDate;
}

/**
 * Get first occurrence of weekday in current or next month
 * Returns current month's first weekday if it hasn't passed yet,
 * otherwise returns next month's first weekday
 */
function getFirstWeekdayOfNextMonth(
  dayIndex: number,
  referenceDate: Date = new Date(),
  timeInfo?: { hour: number; minute: number } | null
): Date {
  const now = referenceDate;

  // Try current month first
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDay = (currentMonth.getDay() + 6) % 7;
  const daysUntil = (dayIndex - firstDay + 7) % 7;

  currentMonth.setDate(1 + daysUntil);

  // Use provided time or default to 9am
  if (timeInfo) {
    currentMonth.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
  } else {
    currentMonth.setHours(9, 0, 0, 0);
  }

  // If the first weekday of current month hasn't passed, return it
  if (currentMonth > now) {
    return currentMonth;
  }

  // Otherwise, get first weekday of next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextFirstDay = (nextMonth.getDay() + 6) % 7;
  const nextDaysUntil = (dayIndex - nextFirstDay + 7) % 7;

  nextMonth.setDate(1 + nextDaysUntil);

  // Use provided time or default to 9am
  if (timeInfo) {
    nextMonth.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
  } else {
    nextMonth.setHours(9, 0, 0, 0);
  }

  return nextMonth;
}
