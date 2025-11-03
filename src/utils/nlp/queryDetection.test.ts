/**
 * Unit tests for query detection
 * Story 1.9.1: Query Detection (Rules) for Query-Based Tasks
 */

import { detectQuery, batchDetectQueries } from './queryDetection';

describe('Query Detection', () => {
  describe('Clear Queries', () => {
    it('detects simple interrogative questions', () => {
      const result1 = detectQuery('What is quantum physics?');
      expect(result1.isQuery).toBe(true);
      expect(result1.confidence).toBeGreaterThanOrEqual(0.7);

      const result2 = detectQuery('How does gravity work?');
      expect(result2.isQuery).toBe(true);
      expect(result2.confidence).toBeGreaterThanOrEqual(0.7);

      const result3 = detectQuery('Why is the sky blue?');
      expect(result3.isQuery).toBe(true);
      expect(result3.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('detects research tasks with keywords', () => {
      const result1 = detectQuery('Research Wheeler\'s "It from bit" statement');
      expect(result1.isQuery).toBe(true);
      expect(result1.confidence).toBeGreaterThanOrEqual(0.7);

      const result2 = detectQuery('Find out what the right basics are to teach kids');
      expect(result2.isQuery).toBe(true);
      expect(result2.confidence).toBeGreaterThanOrEqual(0.7);

      const result3 = detectQuery('Look up information about quantum entanglement');
      expect(result3.isQuery).toBe(true);
      expect(result3.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('detects information-seeking patterns', () => {
      const result1 = detectQuery('What does "ontology" mean in philosophy?');
      expect(result1.isQuery).toBe(true);
      expect(result1.confidence).toBeGreaterThanOrEqual(0.7);

      const result2 = detectQuery('How can I learn more about machine learning?');
      expect(result2.isQuery).toBe(true);
      expect(result2.confidence).toBeGreaterThanOrEqual(0.7);

      const result3 = detectQuery('Explain the concept of entropy');
      expect(result3.isQuery).toBe(true);
      expect(result3.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('detects queries without question marks', () => {
      const result = detectQuery('Find broader context of Wheeler statement');
      expect(result.isQuery).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Clear Actions', () => {
    it('detects action tasks with explicit verbs', () => {
      const result1 = detectQuery('Call mom tomorrow');
      expect(result1.isQuery).toBe(false);
      expect(result1.confidence).toBeLessThan(0.7);

      const result2 = detectQuery('Buy groceries');
      expect(result2.isQuery).toBe(false);
      expect(result2.confidence).toBeLessThan(0.7);

      const result3 = detectQuery('Schedule dentist appointment');
      expect(result3.isQuery).toBe(false);
      expect(result3.confidence).toBeLessThan(0.7);
    });

    it('detects action tasks with time/date focus', () => {
      const result1 = detectQuery('Email Sarah by tomorrow');
      expect(result1.isQuery).toBe(false);
      expect(result1.confidence).toBeLessThan(0.7);

      const result2 = detectQuery('Submit report next week');
      expect(result2.isQuery).toBe(false);
      expect(result2.confidence).toBeLessThan(0.7);

      const result3 = detectQuery('Meet with John at 3pm');
      expect(result3.isQuery).toBe(false);
      expect(result3.confidence).toBeLessThan(0.7);
    });

    it('detects physical action tasks', () => {
      const result1 = detectQuery('Clean the garage');
      expect(result1.isQuery).toBe(false);

      const result2 = detectQuery('Organize my desk');
      expect(result2.isQuery).toBe(false);

      const result3 = detectQuery('Pack for trip');
      expect(result3.isQuery).toBe(false);
    });

    it('detects communication actions', () => {
      const result1 = detectQuery('Text mom about dinner');
      expect(result1.isQuery).toBe(false);

      const result2 = detectQuery('Message Sarah about the project');
      expect(result2.isQuery).toBe(false);

      const result3 = detectQuery('Contact support team');
      expect(result3.isQuery).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles hybrid tasks (research + action)', () => {
      // Hybrid tasks default to action if ambiguous (action verb trumps)
      const result = detectQuery('Research dentists and schedule appointment');
      expect(result.isQuery).toBe(false); // Action verb (-0.5) + research keyword (+0.3) = negative
    });

    it('distinguishes "find" meanings', () => {
      // "Find my keys" - action
      const result1 = detectQuery('Find my keys');
      expect(result1.isQuery).toBe(false);

      // "Find information about X" - query
      const result2 = detectQuery('Find information about AI ethics');
      expect(result2.isQuery).toBe(true);

      // "Find out" - query
      const result3 = detectQuery('Find out how photosynthesis works');
      expect(result3.isQuery).toBe(true);
    });

    it('handles questions with action verbs', () => {
      // Question pattern trumps action verb
      const result = detectQuery('What should I buy for dinner?');
      expect(result.isQuery).toBe(true); // Interrogative + question mark > action verb
    });

    it('handles action questions (how to do something)', () => {
      // "How to X" can be query or action depending on context
      const result1 = detectQuery('How do I fix a leaky faucet');
      expect(result1.isQuery).toBe(true); // Interrogative + info-seeking pattern

      const result2 = detectQuery('Fix leaky faucet');
      expect(result2.isQuery).toBe(false); // Just action verb
    });

    it('rejects empty or too short input', () => {
      const result1 = detectQuery('');
      expect(result1.isQuery).toBe(false);
      expect(result1.confidence).toBe(0);

      const result2 = detectQuery('Go');
      expect(result2.isQuery).toBe(false);
      expect(result2.confidence).toBe(0);
    });

    it('handles case insensitivity', () => {
      const result1 = detectQuery('WHAT IS QUANTUM PHYSICS?');
      expect(result1.isQuery).toBe(true);

      const result2 = detectQuery('Call Mom Tomorrow');
      expect(result2.isQuery).toBe(false);
    });
  });

  describe('Confidence Scoring', () => {
    it('assigns high confidence to clear queries', () => {
      const result = detectQuery('What is the meaning of life?');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('assigns low confidence to clear actions', () => {
      const result = detectQuery('Call mom at 5pm');
      expect(result.confidence).toBeLessThan(0.4);
    });

    it('assigns medium confidence to ambiguous tasks', () => {
      const result = detectQuery('Think about career options');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Reason Field', () => {
    it('provides reasons for query classification', () => {
      const result = detectQuery('What is quantum physics?');
      expect(result.reason).toContain('interrogative');
      expect(result.reason).toContain('question mark');
    });

    it('provides reasons for action classification', () => {
      const result = detectQuery('Call mom tomorrow');
      expect(result.reason).toContain('action verb');
      expect(result.reason).toContain('time/date');
    });

    it('handles no strong signals', () => {
      const result = detectQuery('Think about it');
      expect(result.reason).toBeTruthy();
    });
  });

  describe('Real-World Examples', () => {
    it('detects user-provided example queries', () => {
      const result1 = detectQuery('research what the right "basics" are to teach the kids');
      expect(result1.isQuery).toBe(true);

      const result2 = detectQuery('find broader context of Wheeler\'s statement "It from bit"');
      expect(result2.isQuery).toBe(true);
    });

    it('handles philosophical questions', () => {
      const result = detectQuery('What is the nature of consciousness?');
      expect(result.isQuery).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('handles scientific queries', () => {
      const result = detectQuery('How does CRISPR gene editing work?');
      expect(result.isQuery).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('handles historical queries', () => {
      const result = detectQuery('When did the Renaissance begin?');
      expect(result.isQuery).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Performance', () => {
    it('processes queries quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        detectQuery('What is quantum physics?');
      }
      const duration = Date.now() - start;

      // Should process 100 queries in well under 500ms (5ms per query)
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Batch Detection', () => {
    it('processes multiple tasks at once', () => {
      const tasks = [
        { id: '1', text: 'What is quantum physics?' },
        { id: '2', text: 'Call mom tomorrow' },
        { id: '3', text: 'Research AI ethics' }
      ];

      const results = batchDetectQueries(tasks);

      expect(results).toHaveLength(3);
      expect(results[0].result.isQuery).toBe(true);
      expect(results[1].result.isQuery).toBe(false);
      expect(results[2].result.isQuery).toBe(true);
    });

    it('preserves task IDs in batch results', () => {
      const tasks = [
        { id: 'task-123', text: 'What is AI?' },
        { id: 'task-456', text: 'Buy milk' }
      ];

      const results = batchDetectQueries(tasks);

      expect(results[0].id).toBe('task-123');
      expect(results[1].id).toBe('task-456');
    });
  });
});
