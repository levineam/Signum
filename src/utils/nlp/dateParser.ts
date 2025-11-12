import * as chrono from 'chrono-node';

export interface DateParseOptions {
  timezoneOffset?: number; // Minutes offset from UTC (same as Date#getTimezoneOffset)
  timezone?: string; // Reserved for future IANA timezone integration
  referenceDate?: Date;
}

export interface DateParseResult {
  dueAt: Date;
  rrule?: string;
  matchedText?: string;
}

const DAY_CODE_MAP: Record<string, string> = {
  sunday: 'SU',
  sun: 'SU',
  monday: 'MO',
  mon: 'MO',
  tuesday: 'TU',
  tue: 'TU',
  wednesday: 'WE',
  wed: 'WE',
  thursday: 'TH',
  thu: 'TH',
  thurs: 'TH',
  friday: 'FR',
  fri: 'FR',
  saturday: 'SA',
  sat: 'SA'
};

const ORDINAL_MAP: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  last: -1
};

const MILLIS_IN_MINUTE = 60 * 1000;

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const addWeeks = (date: Date, weeks: number) => addDays(date, weeks * 7);
const addMonths = (date: Date, months: number) => {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

function applyTimezoneOffset(date: Date, timezoneOffset?: number): Date {
  if (typeof timezoneOffset !== 'number') {
    return date;
  }

  const serverOffset = date.getTimezoneOffset();
  const deltaMinutes = timezoneOffset - serverOffset;
  return new Date(date.getTime() + deltaMinutes * MILLIS_IN_MINUTE);
}

function detectRecurrenceRule(text: string): string | undefined {
  const normalized = text.toLowerCase();

  if (/\b(daily|every\s+day|each\s+day)\b/.test(normalized)) {
    return 'FREQ=DAILY';
  }

  if (/\b(weekdays|business\s+days)\b/.test(normalized)) {
    return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
  }

  const weeklyInterval = normalized.match(/every\s+(\d+)\s+(?:weeks?|wks?)/);
  if (weeklyInterval) {
    return `FREQ=WEEKLY;INTERVAL=${weeklyInterval[1]}`;
  }

  const dailyInterval = normalized.match(/every\s+(\d+)\s+(?:days?|d)/);
  if (dailyInterval) {
    return `FREQ=DAILY;INTERVAL=${dailyInterval[1]}`;
  }

  const monthlyInterval = normalized.match(/every\s+(\d+)\s+(?:months?|mos?)/);
  if (monthlyInterval) {
    return `FREQ=MONTHLY;INTERVAL=${monthlyInterval[1]}`;
  }

  if (/\bweekly\b/.test(normalized)) {
    return 'FREQ=WEEKLY';
  }

  if (/\bmonthly\b/.test(normalized)) {
    return 'FREQ=MONTHLY';
  }

  if (/\bquarterly\b/.test(normalized)) {
    return 'FREQ=MONTHLY;INTERVAL=3';
  }

  if (/\byearly|annually\b/.test(normalized)) {
    return 'FREQ=YEARLY';
  }

  const ordinalMatch = normalized.match(
    /(first|second|third|fourth|last)\s+(sundays?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?)\s+of\s+the\s+month/
  );
  if (ordinalMatch) {
    const ordinal = ORDINAL_MAP[ordinalMatch[1]];
    const dayCode = DAY_CODE_MAP[ordinalMatch[2].replace(/s$/, '')];
    if (dayCode) {
      if (ordinal === -1) {
        return `FREQ=MONTHLY;BYDAY=-1${dayCode}`;
      }
      return `FREQ=MONTHLY;BYDAY=${ordinal}${dayCode}`;
    }
  }

  const weekdayMatch = normalized.match(/every\s+(sundays?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?)/);
  if (weekdayMatch) {
    const dayCode = DAY_CODE_MAP[weekdayMatch[1].replace(/s$/, '')];
    if (dayCode) {
      return `FREQ=WEEKLY;BYDAY=${dayCode}`;
    }
  }

  return undefined;
}

export function parseDateExpression(text: string, options: DateParseOptions = {}): DateParseResult | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const referenceDate = options.referenceDate ?? new Date();
  const results = chrono.parse(text, referenceDate, { forwardDate: true });

  let parsedDate: Date | undefined;
  let matchedText: string | undefined;

  if (results.length > 0 && results[0].start) {
    parsedDate = results[0].start.date();
    matchedText = results[0].text;
  }

  const recurrenceRule = detectRecurrenceRule(text);

  if (!parsedDate) {
    if (recurrenceRule) {
      // Provide a reasonable next occurrence when only recurrence is specified
      if (recurrenceRule.startsWith('FREQ=DAILY')) {
        parsedDate = addDays(referenceDate, 1);
      } else if (recurrenceRule.startsWith('FREQ=WEEKLY')) {
        parsedDate = addWeeks(referenceDate, 1);
      } else if (recurrenceRule.startsWith('FREQ=MONTHLY')) {
        parsedDate = addMonths(referenceDate, 1);
      } else if (recurrenceRule.startsWith('FREQ=YEARLY')) {
        parsedDate = addMonths(referenceDate, 12);
      }
    }

    if (!parsedDate) {
      return null;
    }
  }

  const adjustedDate = applyTimezoneOffset(parsedDate, options.timezoneOffset);

  return {
    dueAt: adjustedDate,
    rrule: recurrenceRule,
    matchedText
  };
}
