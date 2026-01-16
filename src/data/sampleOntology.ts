import type { HierarchicalOntologyItem, OntologyCategory } from '@/types/note'

type SampleOntology = Partial<Record<OntologyCategory, HierarchicalOntologyItem[]>>

// Dev/test sample ontology used to validate ontology-driven features (e.g., writing spark).
// Keep this realistic, lightweight, and non-sensitive.
export const SAMPLE_ONTOLOGY: SampleOntology = {
  values: [
    { id: 'sample-value-authenticity', name: 'Authenticity', confidence: 'high', order: 0, excerpts: [] },
    { id: 'sample-value-connection', name: 'Connection', confidence: 'high', order: 1, excerpts: [] },
    { id: 'sample-value-growth', name: 'Growth', confidence: 'medium', order: 2, excerpts: [] },
    { id: 'sample-value-integrity', name: 'Integrity', confidence: 'high', order: 3, excerpts: [] },
  ],
  beliefs: [
    { id: 'sample-belief-learning', name: 'I can learn my way through uncertainty', confidence: 'medium', order: 0, excerpts: [] },
    { id: 'sample-belief-dignity', name: 'People deserve dignity, especially when life is hard', confidence: 'high', order: 1, excerpts: [] },
    { id: 'sample-belief-progress', name: 'Progress beats perfection', confidence: 'high', order: 2, excerpts: [] },
  ],
  people: [
    { id: 'sample-people-sarah', name: 'Sarah', confidence: 'high', order: 0, excerpts: [] },
    { id: 'sample-people-partner', name: 'My partner', confidence: 'medium', order: 1, excerpts: [] },
    { id: 'sample-people-family', name: 'Family', confidence: 'medium', order: 2, excerpts: [] },
  ],
  projects: [
    { id: 'sample-project-direction', name: 'Clarify direction', confidence: 'medium', order: 0, excerpts: [] },
    { id: 'sample-project-writing', name: 'Rebuild a writing habit', confidence: 'high', order: 1, excerpts: [] },
  ],
}

export const SAMPLE_MISSION_HTML =
  '<p>I want to live in a way that feels honest, steady, and connected.</p><p>I want to build things that help people feel less alone—and I want to do it without abandoning my own wellbeing.</p>'


