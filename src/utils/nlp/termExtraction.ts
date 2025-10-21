import { STOP_WORDS } from './stopWords';

export interface TermFrequency {
  term: string;
  count: number;
}

/**
 * Simple Porter Stemmer implementation for basic stemming
 * Based on Martin Porter's algorithm
 */
function stem(word: string): string {
  // Step 1: Handle plurals and -ed/-ing
  word = word.replace(/(ies)$/, 'i');
  word = word.replace(/(es)$/, 'e');
  word = word.replace(/(s)$/, '');
  word = word.replace(/(ed)$/, '');
  word = word.replace(/(ing)$/, '');

  // Step 2: Handle common suffixes
  word = word.replace(/(ational)$/, 'ate');
  word = word.replace(/(tional)$/, 'tion');
  word = word.replace(/(alize)$/, 'al');
  word = word.replace(/(icate)$/, 'ic');
  word = word.replace(/(ative)$/, '');
  word = word.replace(/(ful)$/, '');
  word = word.replace(/(ness)$/, '');

  return word;
}

/**
 * Extract terms from text with tokenization, stop word filtering, and stemming
 *
 * @param text - Input text to process
 * @returns Array of unique terms with their counts
 */
export function extractTerms(text: string): TermFrequency[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Tokenize: split on whitespace and punctuation
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')  // Keep hyphens and apostrophes
    .split(/\s+/)
    .filter(token => token.length > 0);

  // Count term frequencies
  const termCounts = new Map<string, number>();

  for (const token of tokens) {
    // Filter stop words
    if (STOP_WORDS.has(token)) {
      continue;
    }

    // Apply stemming
    const stemmed = stem(token);

    // Filter very short terms (likely not meaningful)
    if (stemmed.length < 2) {
      continue;
    }

    // Increment count
    termCounts.set(stemmed, (termCounts.get(stemmed) || 0) + 1);
  }

  // Convert to array and sort by count descending
  return Array.from(termCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);
}
