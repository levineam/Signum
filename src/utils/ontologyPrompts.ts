/**
 * Ontology extraction prompt templates for GPT-5-mini
 * Story 2.4: AI Personal Ontology Extraction
 */

import { Note } from '@/types/note'

export interface ExtractionResult {
  values: OntologyItem[]
  beliefs: OntologyItem[]
  aims: OntologyItem[]
}

export interface OntologyItem {
  text: string
  confidence: 'high' | 'medium' | 'low'
  sourceExcerpts: Array<{
    noteId: string
    noteTitle: string
    excerpt: string
  }>
}

/**
 * Build extraction prompt from notes
 */
export function buildExtractionPrompt(notes: Note[]): string {
  const notesText = notes
    .map((note, index) => {
      return `[Note ${index + 1} - ID: ${note.id}]
Title: ${note.title}
Content: ${note.content}
---`
    })
    .join('\n\n')

  return `You are an expert at analyzing personal journal entries and notes to extract core philosophical concepts.

Your task is to identify:
1. **Values**: Guiding principles and what matters most (e.g., "Compassion", "Integrity", "Growth")
2. **Beliefs**: Deeply held truths and worldviews (e.g., "People have inherent wisdom", "Meaning comes through struggle")
3. **Aims**: Personal goals and aspirations (e.g., "Build authentic relationships", "Balance ambition with presence")

IMPORTANT GUIDELINES:
- Extract only HIGH-CONFIDENCE items that appear multiple times or are stated explicitly
- Keep extracted text SHORT and MEMORABLE (2-5 words ideally)
- For each value/belief/aim, provide ALL relevant excerpts you find (no limit on count)
- Each excerpt should be 1-2 sentences of actual text from the notes
- Include the exact quote that demonstrates this concept
- Provide noteId and noteTitle for each excerpt
- Look for recurring themes across multiple notes
- Distinguish between values (principles), beliefs (truths), and aims (goals)

NOTES TO ANALYZE:

${notesText}

Return your analysis as JSON in this exact format:
{
  "values": [
    {
      "text": "Compassion",
      "confidence": "high",
      "sourceExcerpts": [
        {
          "noteId": "note-id-1",
          "noteTitle": "Journal Entry - Oct 15",
          "excerpt": "Sometimes the most valuable conversations are the ones where you just witness each other's experience without trying to fix anything."
        },
        {
          "noteId": "note-id-2",
          "noteTitle": "Reflection on Sarah",
          "excerpt": "It's comforting to know that someone else is also figuring things out as they go. Just being present for each other matters."
        }
      ]
    }
  ],
  "beliefs": [
    {
      "text": "Meaning over happiness",
      "confidence": "high",
      "sourceExcerpts": [
        {
          "noteId": "note-id-3",
          "noteTitle": "Journal Entry - Oct 12",
          "excerpt": "I'm realizing that constantly chasing happiness might miss the point. Maybe what matters is finding meaning, even in difficult moments."
        }
      ]
    }
  ],
  "aims": [
    {
      "text": "Balance ambition with presence",
      "confidence": "high",
      "sourceExcerpts": [
        {
          "noteId": "note-id-1",
          "noteTitle": "Work Reflection",
          "excerpt": "I keep pushing for the next milestone, but I'm missing what's happening right now with my family."
        },
        {
          "noteId": "note-id-4",
          "noteTitle": "Journal Entry - Oct 20",
          "excerpt": "Need to find a way to pursue my goals without sacrificing presence in the moment."
        }
      ]
    }
  ]
}

Only include items with "high" confidence. Return empty arrays if no high-confidence items found.`
}

/**
 * Parse GPT response into structured extraction result
 */
export function parseExtractionResult(
  responseText: string
): ExtractionResult {
  try {
    // GPT-5 mini returns JSON directly
    const parsed = JSON.parse(responseText)

    // Validate structure
    if (
      !parsed.values ||
      !parsed.beliefs ||
      !parsed.aims ||
      !Array.isArray(parsed.values) ||
      !Array.isArray(parsed.beliefs) ||
      !Array.isArray(parsed.aims)
    ) {
      throw new Error('Invalid response structure')
    }

    // Validate each item has sourceExcerpts
    const validateItem = (item: any) => {
      if (!item.sourceExcerpts || !Array.isArray(item.sourceExcerpts)) {
        throw new Error('Invalid response: missing sourceExcerpts array')
      }
      item.sourceExcerpts.forEach((excerpt: any) => {
        if (!excerpt.noteId || !excerpt.noteTitle || !excerpt.excerpt) {
          throw new Error('Invalid excerpt: missing required fields (noteId, noteTitle, excerpt)')
        }
      })
    }

    parsed.values?.forEach(validateItem)
    parsed.beliefs?.forEach(validateItem)
    parsed.aims?.forEach(validateItem)

    // Filter to only high-confidence items
    const filterHighConfidence = (items: OntologyItem[]) =>
      items.filter((item) => item.confidence === 'high')

    return {
      values: filterHighConfidence(parsed.values),
      beliefs: filterHighConfidence(parsed.beliefs),
      aims: filterHighConfidence(parsed.aims)
    }
  } catch (error) {
    console.error('Failed to parse extraction result:', error)
    throw new Error('Invalid extraction response format')
  }
}
