import type { Note, OntologyCategory, HierarchicalOntologyItem } from '@/types/note'

export type OntologySparkSignal = 'empty' | 'stale' | 'healthy'

export type OntologySparkFocus = OntologyCategory

export type OntologyWritingSparkInput = {
  focus: OntologySparkFocus
  signal: OntologySparkSignal
  // Small, optional context for generation (keep non-sensitive and tiny)
  context?: {
    exampleItems?: string[]
  }
}

function toPlainText(content?: string): string {
  if (!content) return ''
  return content.replace(/<[^>]*>?/gm, '').trim()
}

function getItems(note?: Note): HierarchicalOntologyItem[] {
  if (!note) return []
  return Array.isArray(note.metadata?.items) ? (note.metadata.items as HierarchicalOntologyItem[]) : []
}

function hasAnyContent(note?: Note): boolean {
  if (!note) return false
  const key = note.metadata?.ontologyCategory
  const text = toPlainText(note.content)
  const items = getItems(note)

  // Text-oriented sections
  if (key === 'higher-power' || key === 'mission') return text.length > 0

  // List-oriented sections (and structured goals/projects/tasks)
  return items.length > 0 || text.length > 0
}

function noteUpdatedAt(note?: Note): number {
  const iso = note?.updatedAt || note?.createdAt
  const t = iso ? Date.parse(iso) : 0
  return Number.isFinite(t) ? t : 0
}

function isStale(note: Note, staleDays: number): boolean {
  const updated = noteUpdatedAt(note)
  if (!updated) return false
  const ageMs = Date.now() - updated
  return ageMs > staleDays * 24 * 60 * 60 * 1000
}

function findSectionNote(pinnedNotes: Note[], section: OntologyCategory): Note | undefined {
  return pinnedNotes.find((n) => n.metadata?.ontologyCategory === section)
}

/**
 * Walks ontology sections in dependency order to pick a single focus that will
 * best spark writing inspiration today.
 *
 * Output is intentionally minimal; it powers copy that feels like an invitation,
 * not an instruction.
 */
export function analyzeOntologyForWritingSpark(pinnedNotes: Note[], opts?: { staleDays?: number }): OntologyWritingSparkInput {
  const staleDays = opts?.staleDays ?? 45

  const order: OntologyCategory[] = [
    'higher-power',
    'beliefs',
    'values',
    'people',
    'mission',
    'goals',
    'projects',
    'tasks',
  ]

  // 1) Prefer the first empty foundational-ish area in order
  for (const section of order) {
    const note = findSectionNote(pinnedNotes, section)
    if (!note) continue
    if (!hasAnyContent(note)) {
      return { focus: section, signal: 'empty' }
    }
  }

  // 2) If nothing is empty, pick the earliest stale section (no mention of time in copy)
  for (const section of order) {
    const note = findSectionNote(pinnedNotes, section)
    if (!note) continue
    if (hasAnyContent(note) && isStale(note, staleDays)) {
      const items = getItems(note).map((i) => i.name).filter(Boolean).slice(0, 4)
      return { focus: section, signal: 'stale', context: { exampleItems: items } }
    }
  }

  // 3) Otherwise, we’re in a healthy state
  return { focus: 'values', signal: 'healthy' }
}


