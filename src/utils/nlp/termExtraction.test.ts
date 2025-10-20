import { describe, it, expect } from 'vitest';
import { extractTerms } from './termExtraction';

describe('extractTerms', () => {
  it('should extract terms from normal paragraph', () => {
    const text = 'I love coding. Coding makes me happy.';
    const terms = extractTerms(text);

    // Should extract "code" (stemmed from "coding") and "happy"
    expect(terms.length).toBeGreaterThan(0);

    const codeTerm = terms.find(t => t.term === 'code' || t.term === 'cod');
    expect(codeTerm).toBeDefined();
    expect(codeTerm?.count).toBeGreaterThanOrEqual(2);
  });

  it('should handle empty text', () => {
    const terms = extractTerms('');
    expect(terms).toEqual([]);
  });

  it('should filter stop words', () => {
    const text = 'the quick brown fox';
    const terms = extractTerms(text);

    // "the" should be filtered out as a stop word
    const stopWords = terms.filter(t => t.term === 'the');
    expect(stopWords.length).toBe(0);

    // "quick", "brown", "fox" should be included
    expect(terms.length).toBeGreaterThan(0);
  });

  it('should handle special characters', () => {
    const text = 'Hello!!! @#$% World???';
    const terms = extractTerms(text);

    // Should extract "hello" and "world", ignoring special chars
    expect(terms.length).toBeGreaterThanOrEqual(2);
  });

  it('should apply stemming', () => {
    const text = 'running runs runner create creates creating';
    const terms = extractTerms(text);

    // Stemming should reduce variations
    const runTerms = terms.filter(t => t.term.startsWith('run'));
    const createTerms = terms.filter(t => t.term.startsWith('creat') || t.term === 'creat');

    expect(runTerms.length).toBeGreaterThanOrEqual(1);
    expect(createTerms.length).toBeGreaterThanOrEqual(1);
  });

  it('should count term frequencies correctly', () => {
    const text = 'apple banana apple cherry apple';
    const terms = extractTerms(text);

    const appleCount = terms.find(t => t.term === 'appl')?.count;
    expect(appleCount).toBe(3);

    const bananaCount = terms.find(t => t.term === 'banana')?.count;
    expect(bananaCount).toBe(1);
  });

  it('should handle only stop words', () => {
    const text = 'the a an is are was were';
    const terms = extractTerms(text);

    // All stop words should be filtered
    expect(terms.length).toBe(0);
  });
});
