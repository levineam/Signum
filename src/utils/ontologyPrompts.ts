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
  sourceNoteIds: string[]
  reasoning: string
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
- Include source note IDs for traceability
- Provide brief reasoning for each extraction
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
      "sourceNoteIds": ["note-id-1", "note-id-2"],
      "reasoning": "Recurring theme about listening and empowering others across multiple entries"
    }
  ],
  "beliefs": [
    {
      "text": "Meaning over happiness",
      "confidence": "high",
      "sourceNoteIds": ["note-id-3"],
      "reasoning": "Explicitly stated philosophy about prioritizing purpose"
    }
  ],
  "aims": [
    {
      "text": "Balance ambition with presence",
      "confidence": "high",
      "sourceNoteIds": ["note-id-1", "note-id-4"],
      "reasoning": "Consistent goal mentioned when reflecting on work-life decisions"
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
