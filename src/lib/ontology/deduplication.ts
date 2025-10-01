/**
 * Deduplication logic for ontology items
 * Story 2.4: AI Personal Ontology Extraction
 */

import { Note } from '@/types/note'
import { OntologyItem } from '@/utils/ontologyPrompts'

/**
 * Deduplicate ontology items by title (case-insensitive)
 * Merges source note IDs and keeps highest confidence
 */
export function deduplicateOntologyItems(
  newItems: OntologyItem[],
  existingNotes: Note[],
  noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
): OntologyItem[] {
  // Filter existing notes by type
  const existingOntologyNotes = existingNotes.filter(
    (note) => note.noteType === noteType
  )

  // Create map of existing titles (lowercase for case-insensitive matching)
  const existingTitlesMap = new Map<string, Note>()
  existingOntologyNotes.forEach((note) => {
    existingTitlesMap.set(note.title.toLowerCase(), note)
  })

  // Deduplicate new items
  const deduplicatedItems: OntologyItem[] = []
  const seenTitles = new Set<string>()

  for (const item of newItems) {
    const lowercaseTitle = item.text.toLowerCase()

    // Check if exists in localStorage
    const existingNote = existingTitlesMap.get(lowercaseTitle)
    if (existingNote) {
      // Merge source IDs
      const existingSourceIds =
        (existingNote.metadata?.extractedFrom as string[]) || []
      const mergedSourceIds = [
        ...new Set([...existingSourceIds, ...item.sourceNoteIds])
      ]

      // Keep higher confidence
      const existingConfidence = existingNote.metadata?.confidence || 'low'
      const confidenceRank = { high: 3, medium: 2, low: 1 }
      const newConfidence =
        confidenceRank[item.confidence] >
        confidenceRank[existingConfidence as keyof typeof confidenceRank]
          ? item.confidence
          : existingConfidence

      // Update reasoning to combine
      const updatedReasoning = `${existingNote.metadata?.aiReasoning || ''}; ${item.reasoning}`.trim()

      // Create updated item
      deduplicatedItems.push({
        text: existingNote.title, // Keep original casing
        confidence: newConfidence as 'high' | 'medium' | 'low',
        sourceNoteIds: mergedSourceIds,
        reasoning: updatedReasoning
      })

      continue
    }

    // Check if duplicate in new items
    if (seenTitles.has(lowercaseTitle)) {
      // Find existing item in deduplicatedItems
      const existingIndex = deduplicatedItems.findIndex(
        (di) => di.text.toLowerCase() === lowercaseTitle
      )

      if (existingIndex !== -1) {
        const existing = deduplicatedItems[existingIndex]
        // Merge source IDs
        existing.sourceNoteIds = [
          ...new Set([...existing.sourceNoteIds, ...item.sourceNoteIds])
        ]
        // Combine reasoning
        existing.reasoning = `${existing.reasoning}; ${item.reasoning}`.trim()
      }

      continue
    }

    // New unique item
    seenTitles.add(lowercaseTitle)
    deduplicatedItems.push(item)
  }

  return deduplicatedItems
}

/**
 * Convert ontology items to Note objects for storage
 */
export function ontologyItemsToNotes(
  items: OntologyItem[],
  noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
): Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] {
  return items.map((item) => ({
    userId: '', // Will be set by caller
    title: item.text,
    content: item.reasoning,
    noteType,
    isPinned: true, // Ontology items are always pinned
    metadata: {
      confidence: item.confidence,
      extractedFrom: item.sourceNoteIds,
      aiReasoning: item.reasoning
    }
  }))
}
