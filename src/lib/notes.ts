/**
 * Notes CRUD operations using Supabase.
 * Story 2.4.1: Authenticated data access with user-specific isolation.
 *
 * All functions require authenticated user ID from Supabase session.
 */

import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  HierarchicalOntologyItem,
  OntologyCategory
} from '@/types/note'
import * as supabaseNotes from '@/lib/supabase/notes'
import { normalizeOntologyItems } from '@/lib/ontology/hierarchy'
import { hasPublicSupabase, supabase } from '@/lib/supabase'
import { SAMPLE_ONTOLOGY, SAMPLE_MISSION_HTML } from '@/data/sampleOntology'

const ONTOLOGY_CATEGORY_ORDER: Record<string, number> = {
  'higher-power': 0,
  beliefs: 1,
  values: 2,
  people: 3,
  mission: 4,
  goals: 5,
  projects: 6,
  tasks: 7
}

function getOntologyCategoryKey(note: Note): string {
  if (note.metadata?.ontologyCategory) return note.metadata.ontologyCategory
  if (note.noteType === 'ontology-value') return 'values'
  if (note.noteType === 'ontology-belief') return 'beliefs'
  if (note.noteType === 'ontology-aim') return 'goals'
  return note.title.toLowerCase()
}

/**
 * Get all notes for authenticated user (calls Supabase)
 */
export async function getNotes(userId: string): Promise<Note[]> {
  try {
    const [journal, regular, ontologyDashboard] = await Promise.all([
      supabaseNotes.getJournalEntries(userId),
      supabaseNotes.getRegularNotes(userId),
      supabaseNotes.getOntologyDashboardNotes(userId)
    ])
    const all = [...journal, ...regular, ...ontologyDashboard]
    // Deduplicate by id in case ontology dashboard notes overlap with regular
    const byId = new Map<string, Note>()
    all.forEach((note) => {
      byId.set(note.id, note)
    })
    return Array.from(byId.values())
  } catch (error) {
    console.error('Error loading notes from Supabase:', error)
    return []
  }
}

/**
 * Create a new note for authenticated user (calls Supabase)
 */
export async function createNote(request: CreateNoteRequest, userId: string, signal?: AbortSignal): Promise<Note> {
  return await supabaseNotes.createNote(request, userId, signal)
}

/**
 * Update an existing note for authenticated user (calls Supabase)
 */
export async function updateNote(id: string, updates: Partial<Note>, userId: string): Promise<Note | null> {
  try {
    const updateRequest: UpdateNoteRequest = {
      id,
      title: updates.title,
      content: updates.content,
      isPinned: updates.isPinned,
      metadata: updates.metadata
    }
    return await supabaseNotes.updateNote(updateRequest, userId)
  } catch (error) {
    console.error('Error updating note:', error)
    return null
  }
}

/**
 * Delete a note for authenticated user (calls Supabase)
 */
export async function deleteNote(id: string, userId: string): Promise<boolean> {
  try {
    await supabaseNotes.deleteNote(id, userId)
    return true
  } catch (error) {
    console.error('Error deleting note:', error)
    return false
  }
}

/**
 * Get a single note by ID for authenticated user (calls Supabase)
 */
export async function getNoteById(id: string, userId: string): Promise<Note | null> {
  try {
    return await supabaseNotes.getNoteById(id, userId)
  } catch (error) {
    console.error('Error fetching note:', error)
    return null
  }
}

/**
 * Initialize pinned ontology notes (Values, Beliefs, Aims) and new custom ontology sections
 * Creates any missing notes individually to recover from partial data
 * Migrates legacy multi-note pattern to single-note-with-items pattern
 */
export async function initializePinnedNotes(
  userId: string,
  options?: { seedSampleData?: boolean }
): Promise<void> {
  try {
    // Avoid slow failures in dev/test when Supabase isn't configured
    if (!hasPublicSupabase()) {
      return
    }

    const shouldSeedSampleData = Boolean(options?.seedSampleData) && process.env.NODE_ENV !== 'production'

    // Get all ontology notes (including old multi-note pattern)
    const existingOntology = await supabaseNotes.getOntologyDashboardNotes(userId)

    // Migrate custom notes missing ontologyCategory metadata (pre-1.11 data)
    await backfillOntologyCategoryMetadata(userId)

    // Migrate legacy multi-note pattern to single-note-with-items
    await migrateLegacyOntologyNotes(userId, existingOntology)

    // Clean up redundant goal names in project titles (pre-PR-211 data)
    await cleanupRedundantProjectNames(userId)

    // Reload after migration
    const currentOntology = await supabaseNotes.getOntologyDashboardNotes(userId)
    const existingKeys = new Set(currentOntology.map(getOntologyCategoryKey))

    // Define required ontology notes
    const requiredNotes: Array<{
      key: string
      type: Note['noteType']
      title: string
      content: string
      metadata?: Note['metadata']
    }> = [
      { key: 'higher-power', type: 'custom', title: 'Higher Order / Power', content: '', metadata: { ontologyCategory: 'higher-power' } },
      {
        key: 'beliefs',
        type: 'ontology-belief',
        title: 'Beliefs',
        content: '',
        metadata: {
          ontologyCategory: 'beliefs',
          items: shouldSeedSampleData ? (SAMPLE_ONTOLOGY.beliefs ?? []) : []
        }
      },
      {
        key: 'values',
        type: 'ontology-value',
        title: 'Values',
        content: '',
        metadata: {
          ontologyCategory: 'values',
          items: shouldSeedSampleData ? (SAMPLE_ONTOLOGY.values ?? []) : []
        }
      },
      {
        key: 'people',
        type: 'custom',
        title: 'People',
        content: '',
        metadata: {
          ontologyCategory: 'people',
          items: shouldSeedSampleData ? (SAMPLE_ONTOLOGY.people ?? []) : []
        }
      },
      {
        key: 'mission',
        type: 'custom',
        title: 'Mission',
        content: shouldSeedSampleData ? SAMPLE_MISSION_HTML : '',
        metadata: { ontologyCategory: 'mission' }
      },
      { key: 'goals', type: 'ontology-aim', title: 'Goals', content: JSON.stringify({ todos: '', goals: '' }), metadata: { ontologyCategory: 'goals', items: [] } },
      { key: 'projects', type: 'custom', title: 'Projects', content: '', metadata: { ontologyCategory: 'projects', items: [] } },
      { key: 'tasks', type: 'custom', title: 'Tasks', content: '', metadata: { ontologyCategory: 'tasks', items: [] } }
    ]

    // Create missing notes individually
    for (const noteConfig of requiredNotes) {
      if (!existingKeys.has(noteConfig.key)) {
        await createNote({
          title: noteConfig.title,
          content: noteConfig.content,
          noteType: noteConfig.type,
          isPinned: true,
          metadata: noteConfig.metadata || {}
        }, userId)
      }
    }

    if (shouldSeedSampleData) {
      const stripHtml = (content?: string) => (content ? content.replace(/<[^>]*>?/gm, '').trim() : '')

      // Reload after creating any missing notes so we can seed existing empty notes too.
      const seededOntology = await supabaseNotes.getOntologyDashboardNotes(userId)
      const byCategory = new Map<string, Note>()
      seededOntology.forEach((note) => {
        const key = getOntologyCategoryKey(note)
        byCategory.set(key, note)
      })

      const seedIfEmpty = async (
        category: OntologyCategory,
        next: { items?: HierarchicalOntologyItem[]; content?: string }
      ) => {
        const note = byCategory.get(category)
        if (!note) return

        const existingItems = Array.isArray(note.metadata?.items) ? (note.metadata.items as HierarchicalOntologyItem[]) : []
        const existingText = stripHtml(note.content)
        const isEmpty = existingItems.length === 0 && existingText.length === 0
        if (!isEmpty) return

        await updateNote(
          note.id,
          {
            content: next.content ?? note.content,
            metadata: {
              ...note.metadata,
              ontologyCategory: category,
              ...(next.items ? { items: next.items } : {})
            }
          },
          userId
        )
      }

      await seedIfEmpty('values', { items: SAMPLE_ONTOLOGY.values ?? [] })
      await seedIfEmpty('beliefs', { items: SAMPLE_ONTOLOGY.beliefs ?? [] })
      await seedIfEmpty('people', { items: SAMPLE_ONTOLOGY.people ?? [] })
      await seedIfEmpty('mission', { content: SAMPLE_MISSION_HTML })
    }
  } catch (error) {
    console.error('Error initializing pinned notes:', error)
  }
}

/**
 * Backfill ontologyCategory metadata for custom pinned notes created before Story 1.11
 * Ensures existing Mission/People/Higher Power/Projects/Tasks notes are visible
 */
async function backfillOntologyCategoryMetadata(userId: string): Promise<void> {
  try {
    // Map note titles to ontologyCategory keys for known custom sections
    const titleToCategory: Record<string, OntologyCategory> = {
      'Higher Order / Power': 'higher-power',
      'Higher Order/Power': 'higher-power',
      'People': 'people',
      'Mission': 'mission',
      'Projects': 'projects',
      'Tasks': 'tasks'
    }

    // Query custom pinned notes directly
    const customNotes = await supabase
      .from('notes')
      .select('id, title, metadata')
      .eq('user_id', userId)
      .eq('note_type', 'custom')
      .eq('is_pinned', true)

    if (customNotes.error) {
      console.error('Error fetching custom notes for backfill:', customNotes.error)
      return
    }

    // Update notes missing ontologyCategory
    for (const note of customNotes.data || []) {
      const metadata = (note.metadata as Record<string, unknown>) || {}
      if (!metadata.ontologyCategory) {
        const category = titleToCategory[note.title as string]
        if (category) {
          await supabase
            .from('notes')
            .update({ metadata: { ...metadata, ontologyCategory: category } })
            .eq('id', note.id)
            .eq('user_id', userId)
        }
      }
    }
  } catch (error) {
    console.error('Error backfilling ontologyCategory metadata:', error)
    // Non-fatal - continue with rest of initialization
  }
}

/**
 * Clean up redundant goal names from project titles
 * Pre-PR-211 seed data included goal name in project title: "Clarify direction — Build mental-health work"
 * This migration removes the redundant suffix, leaving just: "Clarify direction"
 */
async function cleanupRedundantProjectNames(userId: string): Promise<void> {
  try {
    const allNotes = await supabaseNotes.getOntologyDashboardNotes(userId)
    const projectsNote = allNotes.find(note =>
      note.metadata?.ontologyCategory === 'projects'
    )
    const goalsNote = allNotes.find(note =>
      note.metadata?.ontologyCategory === 'goals' || note.noteType === 'ontology-aim'
    )

    if (!projectsNote || !goalsNote) return

    const projects = normalizeOntologyItems(
      projectsNote.metadata?.items as HierarchicalOntologyItem[] | undefined
    ).normalized
    const goals = normalizeOntologyItems(
      goalsNote.metadata?.items as HierarchicalOntologyItem[] | undefined
    ).normalized

    // Build map of goal IDs to names for lookup
    const goalNames = new Map(goals.map(g => [g.id, g.name]))

    let hasChanges = false
    const cleanedProjects = projects.map(project => {
      // Check if project name ends with " — [goal name]" pattern
      const goalName = project.parentId ? goalNames.get(project.parentId) : null
      if (goalName && project.name.endsWith(` — ${goalName}`)) {
        hasChanges = true
        return {
          ...project,
          name: project.name.replace(` — ${goalName}`, '')
        }
      }
      // Also check for single dash variant " - [goal name]"
      if (goalName && project.name.endsWith(` - ${goalName}`)) {
        hasChanges = true
        return {
          ...project,
          name: project.name.replace(` - ${goalName}`, '')
        }
      }
      return project
    })

    if (hasChanges) {
      await updateNote(projectsNote.id, {
        metadata: {
          ...projectsNote.metadata,
          ontologyCategory: 'projects',
          items: cleanedProjects
        }
      }, userId)
      console.log('Cleaned up redundant goal names from project titles')
    }
  } catch (error) {
    console.error('Error cleaning up redundant project names:', error)
    // Non-fatal - continue with rest of initialization
  }
}

/**
 * Migrate legacy ontology notes (one note per item) to new format (one note with items array)
 * Story 2.11: Consolidate multi-note pattern from AI extraction
 */
async function migrateLegacyOntologyNotes(userId: string, notes: Note[]): Promise<void> {
  const noteTypes = ['ontology-value', 'ontology-belief', 'ontology-aim'] as const

  for (const noteType of noteTypes) {
    const notesOfType = notes.filter(n => n.noteType === noteType)

    // If there's 0 or 1 note, no migration needed
    if (notesOfType.length <= 1) continue

    // Multiple notes found - consolidate into first note
    const [firstNote, ...restNotes] = notesOfType

    // Collect all items from all notes
    const allItems = notesOfType.flatMap((note, noteIndex) => {
      const normalized = normalizeOntologyItems(
        note.metadata?.items as HierarchicalOntologyItem[] | undefined
      ).normalized
      const fallbackId = crypto?.randomUUID?.() || `${Date.now()}-${noteIndex}`
      const fallbackConfidence = note.metadata?.confidence || 'high'

      // Preserve all items in the note; if none exist, synthesize one from the title
      if (normalized.length === 0) {
        return [{
          id: fallbackId,
          name: note.title,
          confidence: fallbackConfidence,
          order: noteIndex,
          parentId: undefined,
          excerpts: []
        }]
      }

      return normalized.map((item, itemIndex) => ({
        id: item.id ?? `${fallbackId}-${itemIndex}`,
        name: item.name ?? note.title,
        confidence: item.confidence ?? fallbackConfidence,
        order: typeof item.order === 'number' ? item.order : itemIndex,
        parentId: item.parentId,
        excerpts: item.excerpts ?? []
      }))
    })

    // Update first note with consolidated items
    await updateNote(firstNote.id, {
      metadata: {
        ...firstNote.metadata,
        ontologyCategory: getOntologyCategoryKey({ ...firstNote, noteType } as Note) as OntologyCategory,
        items: allItems
      }
    }, userId)

    // Delete redundant notes
    for (const note of restNotes) {
      await deleteNote(note.id, userId)
    }
  }
}

/**
 * Get pinned ontology notes (Values, Beliefs, Aims) plus custom ontology sections for authenticated user
 */
export async function getPinnedNotes(userId: string): Promise<Note[]> {
  try {
    const notes = await supabaseNotes.getOntologyDashboardNotes(userId)
    return notes.sort((a, b) => {
      const aOrder = ONTOLOGY_CATEGORY_ORDER[getOntologyCategoryKey(a)] ?? 999
      const bOrder = ONTOLOGY_CATEGORY_ORDER[getOntologyCategoryKey(b)] ?? 999
      return aOrder - bOrder
    })
  } catch (error) {
    console.error('Error fetching pinned notes:', error)
    return []
  }
}

/**
 * Get regular notes (excluding pinned ontology notes) for authenticated user
 */
export async function getRegularNotes(userId: string): Promise<Note[]> {
  try {
    return await supabaseNotes.getRegularNotes(userId)
  } catch (error) {
    console.error('Error fetching regular notes:', error)
    return []
  }
}

/**
 * Store ontology items (for AI extraction - Story 2.4.2) for authenticated user
 * Handles deduplication by title (case-insensitive)
 */
export async function storeOntologyItems(
  items: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[],
  noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim',
  userId: string
): Promise<Note[]> {
  try {
    const existingNotes = await supabaseNotes.getOntologyNotes(userId)

    // Create map of existing ontology notes by lowercase title
    const existingMap = new Map<string, Note>()
    existingNotes
      .filter(note => note.noteType === noteType)
      .forEach(note => {
        existingMap.set(note.title.toLowerCase(), note)
      })

    const createdNotes: Note[] = []
    const updatedNotes: Note[] = []

    // Process each item
    for (const item of items) {
      const lowercaseTitle = item.title.toLowerCase()
      const existing = existingMap.get(lowercaseTitle)

      if (existing) {
        // Update existing note
        const updateRequest: UpdateNoteRequest = {
          id: existing.id,
          content: item.content,
          metadata: {
            ...existing.metadata,
            ...item.metadata
          }
        }
        const updated = await supabaseNotes.updateNote(updateRequest, userId)
        updatedNotes.push(updated)
      } else {
        // Create new note
        const createRequest: CreateNoteRequest = {
          title: item.title,
          content: item.content,
          noteType: item.noteType,
          isPinned: item.isPinned,
          metadata: item.metadata
        }
        const created = await supabaseNotes.createNote(createRequest, userId)
        createdNotes.push(created)
      }
    }

    return [...createdNotes, ...updatedNotes]
  } catch (error) {
    console.error('Error storing ontology items:', error)
    return []
  }
}
