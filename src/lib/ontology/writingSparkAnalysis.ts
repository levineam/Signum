import type { Note, OntologyCategory, HierarchicalOntologyItem } from '@/types/note'

/**
 * The canonical order of ontology categories, from foundational to tactical.
 * Used for cycling through categories and determining focus priority.
 */
export const ONTOLOGY_CATEGORY_ORDER: OntologyCategory[] = [
  'higher-power',
  'beliefs',
  'values',
  'people',
  'mission',
  'goals',
  'projects',
  'tasks',
]

export type OntologySparkSignal = 'empty' | 'stale' | 'healthy'

export type OntologySparkFocus = OntologyCategory

export type OntologyWritingSparkInput = {
  focus: OntologySparkFocus
  signal: OntologySparkSignal
  // Small, optional context for generation (keep non-sensitive and tiny)
  context?: {
    exampleItems?: string[] // Items from the focus section
    valueNames?: string[] // User's values (for personalization)
    goalNames?: string[] // User's goals (for personalization)
    missionExcerpt?: string // First ~100 chars of mission (for personalization)
    recentExcerpt?: string // Excerpt from a recent item (for relevance)
    totalItemCount?: number // How populated ontology is overall
  }
}

function toPlainText(content?: string): string {
  if (!content) return ''
  return content.replace(/<[^>]+>/g, '').trim()
}

function getItems(note?: Note): HierarchicalOntologyItem[] {
  if (!note) return []
  return Array.isArray(note.metadata?.items) ? (note.metadata.items as HierarchicalOntologyItem[]) : []
}

/**
 * Check if a JSON content field (used by goals section) has actual content.
 * Goals store content as JSON like {"todos":"","goals":""} even when empty.
 */
function hasJsonContent(content?: string): boolean {
  if (!content) return false
  try {
    const parsed = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null) return false
    // Check if any string values have actual content
    return Object.values(parsed).some(
      (val) => typeof val === 'string' && val.trim().length > 0
    )
  } catch {
    // Not JSON, treat as regular text
    return content.trim().length > 0
  }
}

function hasAnyContent(note?: Note): boolean {
  if (!note) return false
  const key = note.metadata?.ontologyCategory
  const text = toPlainText(note.content)
  const items = getItems(note)

  // Text-oriented sections
  if (key === 'higher-power' || key === 'mission') return text.length > 0

  // Goals section stores content as JSON - check for actual values
  if (key === 'goals') {
    return items.length > 0 || hasJsonContent(note.content)
  }

  // List-oriented sections (and structured projects/tasks)
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
 * Helper to extract mission excerpt (strip HTML, truncate to ~100 chars)
 */
function getMissionExcerpt(sectionMap: Map<OntologyCategory, Note>): string | undefined {
  const missionNote = sectionMap.get('mission')
  if (!missionNote) return undefined
  const text = toPlainText(missionNote.content)
  if (!text) return undefined
  // Truncate at word boundary around 100 chars
  if (text.length <= 100) return text
  const truncated = text.slice(0, 100)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 50 ? truncated.slice(0, lastSpace) + '…' : truncated + '…'
}

/**
 * Helper to count total items across all sections
 */
function countTotalItems(sectionMap: Map<OntologyCategory, Note>): number {
  let total = 0
  for (const note of sectionMap.values()) {
    const items = getItems(note)
    total += items.length
  }
  return total
}

/**
 * Helper to extract value names (up to 6)
 */
function getValueNames(sectionMap: Map<OntologyCategory, Note>): string[] | undefined {
  const valuesNote = sectionMap.get('values')
  if (!valuesNote) return undefined
  const items = getItems(valuesNote).map((i) => i.name).filter(Boolean).slice(0, 6)
  return items.length > 0 ? items : undefined
}

/**
 * Helper to extract goal names (up to 5)
 */
function getGoalNames(sectionMap: Map<OntologyCategory, Note>): string[] | undefined {
  const goalsNote = sectionMap.get('goals')
  if (!goalsNote) return undefined
  const items = getItems(goalsNote).map((i) => i.name).filter(Boolean).slice(0, 5)
  return items.length > 0 ? items : undefined
}

/**
 * Helper to get a representative excerpt from a random populated section
 */
function getRecentExcerpt(
  sectionMap: Map<OntologyCategory, Note>,
  excludeSection: OntologyCategory
): string | undefined {
  // Prioritize goals, values, beliefs for meaningful excerpts
  const preferredOrder: OntologyCategory[] = ['goals', 'values', 'beliefs', 'people', 'projects']
  for (const section of preferredOrder) {
    if (section === excludeSection) continue
    const note = sectionMap.get(section)
    if (!note) continue
    const items = getItems(note)
    if (items.length > 0) {
      // Return a random item name for variety
      const randomItem = items[Math.floor(Math.random() * items.length)]
      return randomItem?.name
    }
  }
  return undefined
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

  const sectionMap = new Map<OntologyCategory, Note>()
  for (const section of ONTOLOGY_CATEGORY_ORDER) {
    const note = findSectionNote(pinnedNotes, section)
    if (note) sectionMap.set(section, note)
  }

  // Handle migrations or new accounts with no section notes yet.
  if (sectionMap.size === 0) {
    return { focus: 'values', signal: 'empty' }
  }

  // Extract shared context
  const missionExcerpt = getMissionExcerpt(sectionMap)
  const totalItemCount = countTotalItems(sectionMap)
  const valueNames = getValueNames(sectionMap)
  const goalNames = getGoalNames(sectionMap)

  // 1) Prefer the first empty foundational-ish area in order
  for (const section of ONTOLOGY_CATEGORY_ORDER) {
    const note = sectionMap.get(section)
    if (!note) continue
    if (!hasAnyContent(note)) {
      const recentExcerpt = getRecentExcerpt(sectionMap, section)
      return {
        focus: section,
        signal: 'empty',
        context: {
          missionExcerpt,
          recentExcerpt,
          valueNames,
          goalNames,
          totalItemCount: totalItemCount > 0 ? totalItemCount : undefined,
        },
      }
    }
  }

  // 2) If nothing is empty, pick the earliest stale section (no mention of time in copy)
  for (const section of ONTOLOGY_CATEGORY_ORDER) {
    const note = sectionMap.get(section)
    if (!note) continue
    if (hasAnyContent(note) && isStale(note, staleDays)) {
      const items = getItems(note).map((i) => i.name).filter(Boolean).slice(0, 6)
      const recentExcerpt = getRecentExcerpt(sectionMap, section)
      return {
        focus: section,
        signal: 'stale',
        context: {
          exampleItems: items,
          missionExcerpt,
          recentExcerpt,
          valueNames,
          goalNames,
          totalItemCount: totalItemCount > 0 ? totalItemCount : undefined,
        },
      }
    }
  }

  // 3) Otherwise, we're in a healthy state — still provide rich context
  const healthyNote = sectionMap.get('values') || sectionMap.get('goals')
  const healthyItems = healthyNote ? getItems(healthyNote).map((i) => i.name).filter(Boolean).slice(0, 5) : []
  const recentExcerpt = getRecentExcerpt(sectionMap, 'values')

  return {
    focus: 'values',
    signal: 'healthy',
    context: {
      exampleItems: healthyItems.length > 0 ? healthyItems : undefined,
      missionExcerpt,
      recentExcerpt,
      valueNames,
      goalNames,
      totalItemCount: totalItemCount > 0 ? totalItemCount : undefined,
    },
  }
}



