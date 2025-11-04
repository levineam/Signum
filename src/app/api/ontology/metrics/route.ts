/**
 * API Route: Ontology Analysis Metrics
 * Story 2.5.1: Bulk Import Ontology Analysis
 *
 * Provides analytics for Story 2.5.1 success metrics (Codex Finding #4)
 * - Time to initial ontology
 * - Queue processing rate
 * - Success rate
 * - Cost per 1000 notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsMetrics } from '@/lib/ontology/queue'

export async function GET(request: NextRequest) {
  try {
    // Optional query param for days to look back
    const daysBack = parseInt(request.nextUrl.searchParams.get('days') || '7')

    if (daysBack < 1 || daysBack > 90) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 90' },
        { status: 400 }
      )
    }

    const metrics = await getAnalyticsMetrics(daysBack)

    return NextResponse.json({
      success: true,
      metrics,
      targets: {
        avgTimeToOntologySeconds: '<20',
        avgNotesPerMinute: '>20',
        successRatePercent: '>95',
        tokensPerThousandNotes: '<5000 (estimate)'
      }
    })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
