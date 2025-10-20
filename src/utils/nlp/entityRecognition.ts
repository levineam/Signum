export interface Entity {
  type: 'person' | 'project' | 'value' | 'organization' | 'domain';
  name: string;
}

/**
 * Simple entity recognition using pattern matching
 * For MVP - can be enhanced with compromise-nlp or other NER libraries later
 *
 * @param text - Input text to process
 * @param userValues - Optional array of user's ontology values for value detection
 * @returns Array of detected entities
 */
export function recognizeEntities(
  text: string,
  userValues?: string[]
): Entity[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const entities: Entity[] = [];

  // Pattern 1: Detect capitalized names (likely people or organizations)
  // Matches patterns like "Mom", "John Smith", "Sarah", etc.
  const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = text.match(namePattern) || [];

  for (const match of matches) {
    // Heuristic: Single word capitalized = person, multi-word = organization or person
    const words = match.split(' ');

    if (words.length === 1) {
      // Single word - likely a person (Mom, Dad, Sarah, etc.)
      entities.push({
        type: 'person',
        name: match
      });
    } else if (words.length === 2 && !isCommonOrganization(match)) {
      // Two words without org indicators - likely person name
      entities.push({
        type: 'person',
        name: match
      });
    } else {
      // Multi-word or org indicators - likely organization
      entities.push({
        type: 'organization',
        name: match
      });
    }
  }

  // Pattern 2: Detect value keywords if user values provided
  if (userValues && userValues.length > 0) {
    for (const value of userValues) {
      const valueLower = value.toLowerCase();
      const textLower = text.toLowerCase();

      if (textLower.includes(valueLower)) {
        entities.push({
          type: 'value',
          name: value
        });
      }
    }
  }

  // Pattern 3: Detect project keywords (capitalized phrases with common project words)
  const projectPattern = /\b(?:Project|Initiative|Campaign|Program)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g;
  const projects = text.match(projectPattern) || [];

  for (const project of projects) {
    entities.push({
      type: 'project',
      name: project
    });
  }

  // Deduplicate entities by name
  const seen = new Set<string>();
  return entities.filter(entity => {
    const key = `${entity.type}:${entity.name}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Helper: Check if text likely refers to an organization
 */
function isCommonOrganization(text: string): boolean {
  const orgIndicators = ['Inc', 'LLC', 'Corp', 'Company', 'Group', 'Team', 'Agency', 'Foundation'];
  return orgIndicators.some(indicator => text.includes(indicator));
}
