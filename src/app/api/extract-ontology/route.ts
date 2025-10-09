/**
 * API Route: Extract ontology from notes using GPT-5-mini
 * Story 2.4: AI Personal Ontology Extraction
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Note } from '@/types/note'
import {
  buildExtractionPrompt,
  parseExtractionResult,
  ExtractionResult
} from '@/utils/ontologyPrompts'

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // 0. Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured',
          details: 'Please set OPENAI_API_KEY environment variable'
        },
        { status: 500 }
      )
    }

    // 1. Parse request body
    const body = await request.json()
    const { notes } = body as { notes: Note[] }

    // 2. Validation
    if (!notes || !Array.isArray(notes)) {
      return NextResponse.json(
        { success: false, error: 'Notes array required' },
        { status: 400 }
      )
    }

    if (notes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No notes to analyze',
          counts: { values: 0, beliefs: 0, aims: 0 }
        },
        { status: 200 }
      )
    }

    if (notes.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Need at least 5 notes for meaningful extraction'
        },
        { status: 400 }
      )
    }

    // 3. Limit to 20 notes for cost control
    const notesToAnalyze = notes.slice(0, 20)

    // 4. Build prompt
    const prompt = buildExtractionPrompt(notesToAnalyze)

    // 5. Call OpenAI GPT-5-mini using Responses API
    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      input: prompt,
      reasoning: {
        effort: 'medium' // Balanced for philosophical analysis
      }
    })

    // Fix: gpt-5-mini returns empty output_text with Responses API
    // Extract text from response.output instead
    let responseText = response.output_text

    if (!responseText && response.output) {
      // Iterate through output items to find message content
      for (const item of response.output) {
        if (item.type === 'message' && item.content) {
          // Find text content in message (type is 'output_text', not 'text')
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text' && 'text' in contentItem) {
              responseText = contentItem.text
              break
            }
          }
        }
        if (responseText) break
      }
    }

    if (!responseText) {
      throw new Error('No response from OpenAI (empty output_text and no message items)')
    }

    // 6. Parse extraction result
    const extraction: ExtractionResult = parseExtractionResult(responseText)

    // 7. Return success response
    return NextResponse.json({
      success: true,
      extraction,
      counts: {
        values: extraction.values.length,
        beliefs: extraction.beliefs.length,
        aims: extraction.aims.length
      }
    })
  } catch (error) {
    console.error('Extraction failed:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Extraction failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
