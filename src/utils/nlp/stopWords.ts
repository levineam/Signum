/**
 * Common English stop words for term extraction
 * These words are filtered out during NLP processing as they don't carry semantic meaning
 */
export const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',

  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'this', 'that', 'these', 'those',

  // Common verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',

  // Prepositions
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'out', 'off', 'over', 'under',

  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'because', 'as', 'while', 'when', 'where',
  'although', 'though', 'unless', 'until', 'since',

  // Common adverbs
  'not', 'no', 'yes', 'very', 'too', 'also', 'only', 'just', 'quite', 'really',
  'almost', 'already', 'always', 'never', 'often', 'sometimes', 'usually',
  'here', 'there', 'now', 'then', 'today', 'yesterday', 'tomorrow',

  // Question words
  'what', 'which', 'who', 'whom', 'whose', 'why', 'how',

  // Other common words
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'than', 'of', 'the', 'get', 'got', 'go', 'went', 'gone', 'going',
  'like', 'make', 'made', 'making', 'take', 'took', 'taken', 'taking'
]);
