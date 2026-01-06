/**
 * Exercise Synthesis API
 * POST /api/exercises/synthesize
 * 
 * Synthesizes exercise results into ontology items using AI
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OpenAI from 'openai'
import { ExerciseType, ExerciseSelection } from '@/lib/exercises/types'

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null

interface SynthesizeRequest {
    userId: string
    exerciseType: ExerciseType
}

export async function POST(request: Request) {
    try {
        const { userId, exerciseType }: SynthesizeRequest = await request.json()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId required' },
                { status: 400 }
            )
        }

        if (!exerciseType) {
            return NextResponse.json(
                { success: false, error: 'exerciseType required' },
                { status: 400 }
            )
        }

        // Get latest exercise result
        const { data: exerciseResult, error: fetchError } = await supabaseAdmin
            .from('exercise_results')
            .select('*')
            .eq('user_id', userId)
            .eq('exercise_type', exerciseType)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        if (fetchError || !exerciseResult) {
            return NextResponse.json(
                { success: false, error: 'No exercise result found' },
                { status: 404 }
            )
        }

        const selections: ExerciseSelection[] = exerciseResult.selections
        const freeText: string | null = exerciseResult.free_text

        // Route to appropriate synthesis based on exercise type
        let ontologyItems: OntologyItem[]

        switch (exerciseType) {
            case 'values':
                ontologyItems = synthesizeValues(selections)
                break

            case 'strengths':
            case 'impact':
            case 'purpose':
                ontologyItems = await synthesizePurpose(userId, selections, freeText)
                break

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown exercise type: ${exerciseType}` },
                    { status: 400 }
                )
        }

        // Save synthesized items to ontology
        const noteType = exerciseType === 'values' ? 'ontology-value' : 'ontology-aim'
        const result = await saveToOntology(userId, noteType, ontologyItems, exerciseResult.id)

        // Update exercise result with generated items
        await supabaseAdmin
            .from('exercise_results')
            .update({
                generated_items: ontologyItems.map(item => ({
                    noteId: result.noteId,
                    itemName: item.name
                }))
            })
            .eq('id', exerciseResult.id)

        return NextResponse.json({
            success: true,
            synthesized: ontologyItems.length,
            items: ontologyItems
        })

    } catch (error) {
        console.error('Exercise synthesis error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// =============================================================================
// Synthesis Functions
// =============================================================================

interface OntologyItem {
    name: string
    confidence: 'high' | 'medium' | 'low'
    excerpts: Array<{
        noteId: string
        noteTitle: string
        excerpt: string
    }>
}

/**
 * Synthesize values - direct mapping from selections
 */
function synthesizeValues(selections: ExerciseSelection[]): OntologyItem[] {
    // Sort by rank if available, take top items
    const sorted = [...selections].sort((a, b) => (a.rank || 99) - (b.rank || 99))

    return sorted.map(selection => ({
        name: selection.name,
        confidence: 'high' as const,
        excerpts: [{
            noteId: 'exercise-values',
            noteTitle: 'Values Discovery Exercise',
            excerpt: selection.description || `Selected as a core value: ${selection.name}`
        }]
    }))
}

/**
 * Synthesize purpose from strengths, impact, and/or direct purpose input
 */
async function synthesizePurpose(
    userId: string,
    selections: ExerciseSelection[],
    freeText: string | null
): Promise<OntologyItem[]> {
    // Try to get complementary exercise results
    const { data: allResults } = await supabaseAdmin
        .from('exercise_results')
        .select('*')
        .eq('user_id', userId)
        .in('exercise_type', ['strengths', 'impact', 'purpose'])
        .order('completed_at', { ascending: false })

    // Collect context from all related exercises
    let strengths: ExerciseSelection[] = []
    let beneficiaries: ExerciseSelection[] = []
    let impactText = ''

    allResults?.forEach(result => {
        const sels: ExerciseSelection[] = result.selections
        switch (result.exercise_type) {
            case 'strengths':
                strengths = sels.slice(0, 3) // Top 3 strengths
                break
            case 'impact':
                beneficiaries = sels
                impactText = result.free_text || ''
                break
        }
    })

    // If we don't have enough context, create basic items
    if (!openai || (strengths.length === 0 && beneficiaries.length === 0 && !freeText)) {
        return selections.map(s => ({
            name: s.name,
            confidence: 'medium' as const,
            excerpts: [{
                noteId: 'exercise-purpose',
                noteTitle: 'Purpose Discovery Exercise',
                excerpt: s.description || `Selected: ${s.name}`
            }]
        }))
    }

    // Use AI to synthesize purpose statements
    const prompt = buildPurposeSynthesisPrompt(strengths, beneficiaries, impactText, freeText)

    try {
        const response = await openai.responses.create({
            model: 'gpt-5-mini',
            input: prompt,
            reasoning: { effort: 'low' }
        })

        const text = response.output_text || ''
        return parsePurposeResponse(text)
    } catch (error) {
        console.error('AI synthesis failed:', error)
        // Fallback to basic synthesis
        return createFallbackPurposeItems(strengths, beneficiaries, impactText)
    }
}

function buildPurposeSynthesisPrompt(
    strengths: ExerciseSelection[],
    beneficiaries: ExerciseSelection[],
    impactText: string,
    freeText: string | null
): string {
    const strengthNames = strengths.map(s => s.name).join(', ')
    const beneficiaryNames = beneficiaries.map(b => b.name).join(', ')

    return `Based on a user's self-discovery exercise, generate 2-3 personal mission/goal statements.

User's Inputs:
${strengths.length > 0 ? `- Top Strengths: ${strengthNames}` : ''}
${beneficiaries.length > 0 ? `- Who they want to help: ${beneficiaryNames}` : ''}
${impactText ? `- Change they want to create: ${impactText}` : ''}
${freeText ? `- Additional context: ${freeText}` : ''}

Generate personal goal statements that:
1. Are actionable and inspiring
2. Combine their strengths with who they want to serve
3. Feel personal and meaningful (not generic)
4. Are 5-15 words each

Return as JSON array:
[
  { "name": "Goal statement here", "reasoning": "Why this fits" }
]

Return ONLY the JSON array, no other text.`
}

function parsePurposeResponse(text: string): OntologyItem[] {
    try {
        // Extract JSON from response
        const match = text.match(/\[[\s\S]*\]/)
        if (!match) return []

        const parsed = JSON.parse(match[0])
        return parsed.map((item: { name: string; reasoning: string }) => ({
            name: item.name,
            confidence: 'high' as const,
            excerpts: [{
                noteId: 'exercise-purpose-synthesis',
                noteTitle: 'Purpose Synthesis',
                excerpt: item.reasoning || 'Synthesized from your strengths and impact goals'
            }]
        }))
    } catch {
        return []
    }
}

function createFallbackPurposeItems(
    strengths: ExerciseSelection[],
    beneficiaries: ExerciseSelection[],
    impactText: string
): OntologyItem[] {
    const items: OntologyItem[] = []

    if (strengths.length > 0 && beneficiaries.length > 0) {
        const strength = strengths[0].name
        const who = beneficiaries[0].name
        items.push({
            name: `Use ${strength} to help ${who}`,
            confidence: 'medium',
            excerpts: [{
                noteId: 'exercise-fallback',
                noteTitle: 'Purpose Discovery',
                excerpt: `Combining strength in ${strength} with desire to serve ${who}`
            }]
        })
    }

    if (impactText) {
        items.push({
            name: impactText.slice(0, 100),
            confidence: 'high',
            excerpts: [{
                noteId: 'exercise-impact',
                noteTitle: 'Impact Statement',
                excerpt: impactText
            }]
        })
    }

    return items
}

// =============================================================================
// Save to Ontology
// =============================================================================

async function saveToOntology(
    userId: string,
    noteType: 'ontology-value' | 'ontology-aim',
    items: OntologyItem[],
    exerciseResultId: string
): Promise<{ noteId: string }> {
    // Find the pinned ontology note for this type
    const { data: existingNote } = await supabaseAdmin
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('note_type', noteType)
        .eq('is_pinned', true)
        .single()

    if (!existingNote) {
        throw new Error(`Pinned ${noteType} note not found`)
    }

    // Get existing items
    const existingItems = (existingNote.metadata?.items as OntologyItem[]) || []

    // Merge items (avoid duplicates by name)
    const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()))
    const newItems = items.filter(i => !existingNames.has(i.name.toLowerCase()))

    const mergedItems = [...existingItems, ...newItems]

    // Update the note
    const { error } = await supabaseAdmin
        .from('notes')
        .update({
            metadata: {
                ...existingNote.metadata,
                items: mergedItems,
                lastExerciseId: exerciseResultId,
                lastExerciseAt: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
        })
        .eq('id', existingNote.id)

    if (error) {
        throw error
    }

    return { noteId: existingNote.id }
}
