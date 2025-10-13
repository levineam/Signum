/**
 * Incremental Ontology Extraction Service
 * Story 2.4.4: Incremental AI Ontology Analysis
 *
 * Handles extracting ontology items from new/updated notes
 * and merging with existing ontology.
 */

import OpenAI from 'openai'
import { Note } from '@/types/note'
import {
  ExtractionResult,
  parseExtractionResult
} from '@/utils/ontologyPrompts'
import { mergeOntologyItems } from './merge'
import { supabase } from '@/lib/supabase'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null

export interface IncrementalExtractionResult {
  newValues: number
  newBeliefs: number
  newAims: number
  mergedValues: number
  mergedBeliefs: number
  mergedAims: number
}

/**
 * Build incremental extraction prompt
 * Includes summary of existing ontology to avoid duplicates
 */
function buildIncrementalPrompt(
  newNotes: Note[],
  existingOntology: {
    values: string[]
    beliefs: string[]
    aims: string[]
  }
): string {
  const notesText = newNotes
    .map((note, index) => {
      return `[Note ${index + 1} - ID: ${note.id}]
Title: ${note.title}
Content: ${note.content}
---`
    })
    .join('\n\n')

  const existingValuesText =
    existingOntology.values.length > 0
      ? `\nExisting Values:\n${existingOntology.values.map((v) => `- ${v}`).join('\n')}`
      : ''

  const existingBeliefsText =
    existingOntology.beliefs.length > 0
      ? `\nExisting Beliefs:\n${existingOntology.beliefs.map((b) => `- ${b}`).join('\n')}`
      : ''

  const existingAimsText =
    existingOntology.aims.length > 0
      ? `\nExisting Aims:\n${existingOntology.aims.map((a) => `- ${a}`).join('\n')}`
      : ''

  return `You are an expert at analyzing personal journal entries and notes to extract core philosophical concepts.

Your task is to identify NEW or UPDATED items from the recent notes that are not already in the existing ontology:

1. **Values**: Guiding principles and what matters most (e.g., "Compassion", "Integrity", "Growth")
2. **Beliefs**: Deeply held truths and worldviews (e.g., "People have inherent wisdom", "Meaning comes through struggle")
3. **Aims**: Personal goals and aspirations (e.g., "Build authentic relationships", "Balance ambition with presence")

EXISTING ONTOLOGY (avoid duplicates):${existingValuesText}${existingBeliefsText}${existingAimsText}

IMPORTANT GUIDELINES:
- Extract only HIGH-CONFIDENCE items that appear multiple times or are stated explicitly
- AVOID duplicating items from the existing ontology above
- If a new note provides additional evidence for an existing item, include it with the existing item's title
- Keep extracted text SHORT and MEMORABLE (2-5 words ideally)
- For each value/belief/aim, provide up to 5 most representative excerpts
- Each excerpt should be 1-2 sentences of actual text from the notes
- Include the exact quote that demonstrates this concept
- Provide noteId and noteTitle for each excerpt
- Look for recurring themes across multiple notes
- Distinguish between values (principles), beliefs (truths), and aims (goals)

NEW NOTES TO ANALYZE:

${notesText}

RESPONSE FORMAT: Prefer returning raw JSON without markdown code blocks. If you include markdown formatting, ensure the content is still valid JSON.

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
          "excerpt": "I'm realizing that constantly chasing happiness might miss the point."
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
          "excerpt": "I keep pushing for the next milestone, but I'm missing what's happening right now."
        }
      ]
    }
  ]
}

Only include items with "high" confidence. Return empty arrays if no high-confidence items found.`
}

/**
 * Get existing ontology items for a user
 */
async function getExistingOntology(userId: string): Promise<{
  values: Note[]
  beliefs: Note[]
  aims: Note[]
  valueTexts: string[]
  beliefTexts: string[]
  aimTexts: string[]
}> {
  const { data: ontologyNotes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .in('note_type', ['ontology-value', 'ontology-belief', 'ontology-aim'])

  if (error) {
    console.error('Failed to get existing ontology:', error)
    throw error
  }

  // Convert snake_case to camelCase for TypeScript Note type
  const convertToNote = (row: {
    id: string
    user_id: string
    title: string
    content: string
    note_type: string
    is_pinned: boolean
    metadata: any
    created_at: string
    updated_at: string
  }): Note => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    noteType: row.note_type,
    isPinned: row.is_pinned,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })

  const values = ontologyNotes?.filter((n) => n.note_type === 'ontology-value').map(convertToNote) || []
  const beliefs = ontologyNotes?.filter((n) => n.note_type === 'ontology-belief').map(convertToNote) || []
  const aims = ontologyNotes?.filter((n) => n.note_type === 'ontology-aim').map(convertToNote) || []

  // Extract text summaries from metadata
  const extractTexts = (notes: Note[]) => {
    const texts: string[] = []
    notes.forEach((note) => {
      if (note.metadata?.items) {
        note.metadata.items.forEach((item) => {
          if (item.name) texts.push(item.name)
        })
      }
    })
    return texts
  }

  return {
    values,
    beliefs,
    aims,
    valueTexts: extractTexts(values),
    beliefTexts: extractTexts(beliefs),
    aimTexts: extractTexts(aims)
  }
}

/**
 * Run incremental extraction on new notes
 */
export async function runIncrementalExtraction(
  userId: string,
  newNotes: Note[]
): Promise<IncrementalExtractionResult> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  // 1. Get existing ontology
  const existing = await getExistingOntology(userId)

  // 2. Build incremental prompt
  const prompt = buildIncrementalPrompt(newNotes, {
    values: existing.valueTexts,
    beliefs: existing.beliefTexts,
    aims: existing.aimTexts
  })

  // 3. Call OpenAI GPT-5-mini
  const response = await openai.responses.create({
    model: 'gpt-5-mini',
    input: prompt,
    reasoning: {
      effort: 'medium'
    }
  })

  // 4. Extract response text (handle gpt-5-mini quirks)
  let responseText = response.output_text

  if (!responseText && response.output) {
    const textChunks: string[] = []
    for (const item of response.output) {
      if (item.type === 'message' && item.content) {
        for (const contentItem of item.content) {
          if (contentItem.type === 'output_text' && 'text' in contentItem) {
            textChunks.push(contentItem.text)
          }
        }
      }
    }
    responseText = textChunks.join('')
  }

  if (!responseText) {
    throw new Error('No response from OpenAI')
  }

  // 5. Parse extraction result
  const extraction: ExtractionResult = parseExtractionResult(responseText)

  // 6. Merge with existing ontology
  const mergeResults = await mergeOntologyItems(
    userId,
    extraction,
    existing
  )

  return {
    newValues: mergeResults.newValues,
    newBeliefs: mergeResults.newBeliefs,
    newAims: mergeResults.newAims,
    mergedValues: mergeResults.mergedValues,
    mergedBeliefs: mergeResults.mergedBeliefs,
    mergedAims: mergeResults.mergedAims
  }
}
