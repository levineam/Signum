/**
 * Ontology Merge & Persistence Logic
 * Story 2.4.4: Incremental AI Ontology Analysis
 *
 * Handles merging newly extracted ontology items with existing ones,
 * including deduplication, confidence reconciliation, and metadata aggregation.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { Note } from '@/types/note'
import { ExtractionResult, OntologyItem } from '@/utils/ontologyPrompts'

export interface MergeResult {
  newValues: number
  newBeliefs: number
  newAims: number
  mergedValues: number
  mergedBeliefs: number
  mergedAims: number
}

/**
 * Normalize text for matching (lowercase, trim, remove extra spaces)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}


/**
 * Reconcile confidence levels - returns higher confidence
 */
function reconcileConfidence(
  conf1: 'high' | 'medium' | 'low',
  conf2: 'high' | 'medium' | 'low'
): 'high' | 'medium' | 'low' {
  const ranking = { high: 3, medium: 2, low: 1 }
  return ranking[conf1] >= ranking[conf2] ? conf1 : conf2
}

/**
 * Merge source excerpts, removing duplicates
 */
function mergeSourceExcerpts(
  existingExcerpts: OntologyItem['sourceExcerpts'],
  newExcerpts: OntologyItem['sourceExcerpts']
): OntologyItem['sourceExcerpts'] {
  const merged = [...existingExcerpts]
  const existingKeys = new Set(
    existingExcerpts.map((e) => `${e.noteId}:${e.excerpt}`)
  )

  for (const newExcerpt of newExcerpts) {
    const key = `${newExcerpt.noteId}:${newExcerpt.excerpt}`
    if (!existingKeys.has(key)) {
      merged.push(newExcerpt)
    }
  }

  return merged
}

/**
 * Merge newly extracted ontology items with existing ontology
 */
export async function mergeOntologyItems(
  userId: string,
  extraction: ExtractionResult,
  existing: {
    values: Note[]
    beliefs: Note[]
    aims: Note[]
  }
): Promise<MergeResult> {
  let newValues = 0
  let newBeliefs = 0
  let newAims = 0
  let mergedValues = 0
  let mergedBeliefs = 0
  let mergedAims = 0

  // Helper to process each category
  async function processCategory(
    newItems: OntologyItem[],
    existingNotes: Note[],
    noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
  ): Promise<{ newCount: number; mergedCount: number }> {
    let newCount = 0
    let mergedCount = 0

    // Get the pinned ontology note for this category
    // SECURITY FIX: Filter by isPinned to avoid corrupting individual ontology cards
    const pinnedNote = existingNotes.find((n) => n.noteType === noteType && n.isPinned)

    if (!pinnedNote) {
      throw new Error(`Pinned ${noteType} note not found`)
    }

    // Get existing items from metadata
    const existingItems = (pinnedNote.metadata?.items || []) as Array<{
      name: string
      confidence: 'high' | 'medium' | 'low'
      excerpts: OntologyItem['sourceExcerpts']
    }>

    // Build map of existing items by normalized name
    const existingMap = new Map<string, typeof existingItems[0]>()
    existingItems.forEach((item) => {
      existingMap.set(normalizeText(item.name), item)
    })

    // Process new items
    const updatedItems = [...existingItems]

    for (const newItem of newItems) {
      const normalizedName = normalizeText(newItem.text)
      const existing = existingMap.get(normalizedName)

      if (existing) {
        // Merge with existing
        mergedCount++

        // Update confidence if new is higher
        const newConfidence = reconcileConfidence(
          existing.confidence,
          newItem.confidence
        )

        // Merge excerpts
        const mergedExcerpts = mergeSourceExcerpts(
          existing.excerpts,
          newItem.sourceExcerpts
        )

        // Update in array
        const index = updatedItems.findIndex(
          (item) => normalizeText(item.name) === normalizedName
        )
        if (index !== -1) {
          updatedItems[index] = {
            ...existing,
            confidence: newConfidence,
            excerpts: mergedExcerpts
          }
        }
      } else {
        // New item
        newCount++
        updatedItems.push({
          name: newItem.text,
          confidence: newItem.confidence,
          excerpts: newItem.sourceExcerpts
        })
      }
    }

    // Update the pinned note with merged items (SECURITY FIX: Issue #4)
    const { error } = await supabaseAdmin
      .from('notes')
      .update({
        metadata: {
          ...pinnedNote.metadata,
          items: updatedItems
        }
      })
      .eq('id', pinnedNote.id)
      .eq('user_id', userId)

    if (error) {
      console.error(`Failed to update ${noteType}:`, error)
      throw error
    }

    return { newCount, mergedCount }
  }

  // Process each category
  try {
    // Values
    const valuesResult = await processCategory(
      extraction.values,
      existing.values,
      'ontology-value'
    )
    newValues = valuesResult.newCount
    mergedValues = valuesResult.mergedCount

    // Beliefs
    const beliefsResult = await processCategory(
      extraction.beliefs,
      existing.beliefs,
      'ontology-belief'
    )
    newBeliefs = beliefsResult.newCount
    mergedBeliefs = beliefsResult.mergedCount

    // Aims
    const aimsResult = await processCategory(
      extraction.aims,
      existing.aims,
      'ontology-aim'
    )
    newAims = aimsResult.newCount
    mergedAims = aimsResult.mergedCount

    return {
      newValues,
      newBeliefs,
      newAims,
      mergedValues,
      mergedBeliefs,
      mergedAims
    }
  } catch (error) {
    console.error('Merge failed:', error)
    throw error
  }
}

/**
 * Deduplicate ontology items within a list (helper for initial extraction)
 */
export function deduplicateWithinList(items: OntologyItem[]): OntologyItem[] {
  const seen = new Map<string, OntologyItem>()

  for (const item of items) {
    const normalized = normalizeText(item.text)
    const existing = seen.get(normalized)

    if (existing) {
      // Merge with existing in list
      existing.confidence = reconcileConfidence(
        existing.confidence,
        item.confidence
      )
      existing.sourceExcerpts = mergeSourceExcerpts(
        existing.sourceExcerpts,
        item.sourceExcerpts
      )
    } else {
      seen.set(normalized, { ...item })
    }
  }

  return Array.from(seen.values())
}
