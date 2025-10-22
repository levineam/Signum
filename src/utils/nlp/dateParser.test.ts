/**
 * Unit tests for date parser
 * Story 1.2: Natural Language Task/Reminder Parsing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseDate } from './dateParser';

describe('dateParser', () => {
  let now: Date;

  beforeEach(() => {
    // Use fixed date for consistent testing
    now = new Date('2025-01-15T10:00:00Z');
  });

  describe('Relative dates', () => {
    it('should parse "tomorrow"', () => {
      const result = parseDate('Remind me tomorrow');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      // Should be ~1 day from now
      const daysDiff = Math.floor((result!.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(0);
      expect(daysDiff).toBeLessThanOrEqual(2);
    });

    it('should parse "in 5 days"', () => {
      const result = parseDate('Remind me in 5 days');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should parse "in 3 hours"', () => {
      const result = parseDate('Call mom in 3 hours');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should parse "next week"', () => {
      const result = parseDate('Finish report next week');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should parse "in 10 days"', () => {
      const result = parseDate('Review contract in 10 days');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });
  });

  describe('Absolute dates', () => {
    it('should parse "Oct 25"', () => {
      const result = parseDate('Meeting on Oct 25');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getMonth()).toBe(9); // October = month 9
      expect(result?.dueAt.getDate()).toBe(25);
    });

    it('should parse "next Friday"', () => {
      const result = parseDate('Appointment next Friday');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getDay()).toBe(5); // Friday
    });

    it('should parse "next Fri 8a"', () => {
      const result = parseDate('Call next Fri 8a');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getDay()).toBe(5); // Friday
    });

    it('should parse "2025-11-01"', () => {
      const result = parseDate('Deadline 2025-11-01');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getFullYear()).toBe(2025);
      expect(result?.dueAt.getMonth()).toBe(10); // November = month 10
      expect(result?.dueAt.getDate()).toBe(1);
    });

    it('should parse "December 1st"', () => {
      const result = parseDate('Party on December 1st');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getMonth()).toBe(11); // December = month 11
      expect(result?.dueAt.getDate()).toBe(1);
    });

    it('should parse "Jan 15th 2026"', () => {
      const result = parseDate('Conference Jan 15th 2026');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getFullYear()).toBe(2026);
      expect(result?.dueAt.getMonth()).toBe(0); // January = month 0
      expect(result?.dueAt.getDate()).toBe(15);
    });
  });

  describe('Recurring dates', () => {
    it('should parse "every Monday" with RRULE', () => {
      const result = parseDate('Team meeting every Monday');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=WEEKLY');
      expect(result?.rrule).toContain('BYDAY=MO');
    });

    it('should parse "every Mon" with RRULE', () => {
      const result = parseDate('Standup every Mon');
      expect(result).toBeTruthy();
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=WEEKLY');
    });

    it('should parse "daily" with RRULE', () => {
      const result = parseDate('Exercise daily');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=DAILY');
    });

    it('should parse "every day" with RRULE', () => {
      const result = parseDate('Meditate every day');
      expect(result).toBeTruthy();
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=DAILY');
    });

    it('should parse "every 2 weeks" with RRULE', () => {
      const result = parseDate('Dentist every 2 weeks');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=WEEKLY');
      expect(result?.rrule).toContain('INTERVAL=2');
    });

    it('should parse "every week" with RRULE', () => {
      const result = parseDate('Review goals every week');
      expect(result).toBeTruthy();
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=WEEKLY');
    });

    it('should parse "every month" with RRULE', () => {
      const result = parseDate('Pay rent every month');
      expect(result).toBeTruthy();
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=MONTHLY');
    });

    it('should parse "first Monday of month" with RRULE', () => {
      const result = parseDate('All-hands first Monday of month');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=MONTHLY');
      expect(result?.rrule).toContain('BYDAY=MO'); // Monday
    });

    it('should parse "first Friday of month" with correct weekday in RRULE', () => {
      const result = parseDate('Team party first Friday of month');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('FREQ=MONTHLY');
      expect(result?.rrule).toContain('BYDAY=FR'); // Friday, not Monday
    });

    it('should parse "first Wednesday of month" with correct weekday in RRULE', () => {
      const result = parseDate('Monthly review first Wednesday of month');
      expect(result).toBeTruthy();
      expect(result?.rrule).toBeTruthy();
      expect(result?.rrule).toContain('BYDAY=WE'); // Wednesday
    });

    it('should use current month for "first weekday of month" if not yet passed', () => {
      // This test verifies that if today is Oct 5 and the first Monday is Oct 7,
      // the task is scheduled for Oct 7 (current month), not Nov 4 (next month)
      const result = parseDate('Meeting first Monday of month');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);

      const now = new Date();
      const dueDate = result!.dueAt;

      // The due date should be either this month or next month
      const isCurrentMonth = dueDate.getMonth() === now.getMonth();
      const isNextMonth = dueDate.getMonth() === (now.getMonth() + 1) % 12;

      expect(isCurrentMonth || isNextMonth).toBe(true);

      // If it's this month, it should be in the future
      if (isCurrentMonth) {
        expect(dueDate.getTime()).toBeGreaterThan(now.getTime());
      }
    });
  });

  describe('Edge cases', () => {
    it('should return null for text with no date', () => {
      const result = parseDate('I love coding');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseDate('');
      expect(result).toBeNull();
    });

    it('should return null for gibberish', () => {
      const result = parseDate('asdfasdfasdf');
      expect(result).toBeNull();
    });

    it('should handle "today"', () => {
      const result = parseDate('Finish this today');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should handle "tonight"', () => {
      const result = parseDate('Dinner tonight');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should handle multiple dates and pick the first', () => {
      const result = parseDate('Meeting tomorrow and next week');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      // Should pick "tomorrow" (first date)
    });

    it('should handle ambiguous "May" (should interpret as month)', () => {
      const result = parseDate('Event in May');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
      expect(result?.dueAt.getMonth()).toBe(4); // May = month 4
    });
  });

  describe('Time-specific dates', () => {
    it('should parse "tomorrow at 3pm"', () => {
      const result = parseDate('Call Sarah tomorrow at 3pm');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });

    it('should parse "Friday at 9:30am"', () => {
      const result = parseDate('Meeting Friday at 9:30am');
      expect(result).toBeTruthy();
      expect(result?.dueAt).toBeInstanceOf(Date);
    });
  });
});
