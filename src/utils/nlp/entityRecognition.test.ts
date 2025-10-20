import { describe, it, expect } from 'vitest';
import { recognizeEntities } from './entityRecognition';

describe('recognizeEntities', () => {
  it('should extract person names', () => {
    const text = 'Call Mom tomorrow about the project with Sarah.';
    const entities = recognizeEntities(text);

    const personEntities = entities.filter(e => e.type === 'person');
    expect(personEntities.length).toBeGreaterThan(0);

    const names = personEntities.map(e => e.name);
    expect(names).toContain('Mom');
    expect(names).toContain('Sarah');
  });

  it('should map organizations to project type', () => {
    const text = 'Google announced a new AI model yesterday.';
    const entities = recognizeEntities(text);

    // Organizations are mapped to 'project' type per DB schema
    const projectEntities = entities.filter(e => e.type === 'project');
    expect(projectEntities.length).toBeGreaterThan(0);

    const names = projectEntities.map(e => e.name);
    expect(names).toContain('Google');
  });

  it('should handle empty text', () => {
    const entities = recognizeEntities('');
    expect(entities).toEqual([]);
  });

  it('should handle text with no entities', () => {
    const text = 'this is a sentence with no capitalized names';
    const entities = recognizeEntities(text);

    expect(entities.length).toBe(0);
  });

  it('should detect value keywords when provided', () => {
    const text = 'I value family and creativity in my work.';
    const userValues = ['family', 'creativity', 'honesty'];
    const entities = recognizeEntities(text, userValues);

    const valueEntities = entities.filter(e => e.type === 'value');
    expect(valueEntities.length).toBeGreaterThanOrEqual(2);

    const names = valueEntities.map(e => e.name);
    expect(names).toContain('family');
    expect(names).toContain('creativity');
  });

  it('should deduplicate entities', () => {
    const text = 'Sarah called Sarah about Sarah\'s project.';
    const entities = recognizeEntities(text);

    const sarahEntities = entities.filter(e => e.name === 'Sarah');
    expect(sarahEntities.length).toBe(1);
  });

  it('should handle mixed entity types', () => {
    const text = 'Project Moonshot with Mom and Google Inc.';
    const entities = recognizeEntities(text);

    // Should detect person (Mom) and projects (Google Inc, Project Moonshot)
    expect(entities.length).toBeGreaterThan(0);

    const types = entities.map(e => e.type);
    expect(types).toContain('person');
    expect(types).toContain('project');
  });
});
