/**
 * Exercise Results API - Save endpoint
 * POST /api/exercises/save
 * 
 * Saves exercise results to the database
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ExerciseResult } from '@/lib/exercises/types'

export async function POST(request: Request) {
    try {
        const body: ExerciseResult = await request.json()

        // Validate required fields
        if (!body.userId) {
            return NextResponse.json(
                { success: false, error: 'userId required' },
                { status: 400 }
            )
        }

        if (!body.exerciseType) {
            return NextResponse.json(
                { success: false, error: 'exerciseType required' },
                { status: 400 }
            )
        }

        if (!body.selections || !Array.isArray(body.selections)) {
            return NextResponse.json(
                { success: false, error: 'selections array required' },
                { status: 400 }
            )
        }

        // Get current version for this exercise type
        const { data: existing } = await supabaseAdmin
            .from('exercise_results')
            .select('version')
            .eq('user_id', body.userId)
            .eq('exercise_type', body.exerciseType)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        const nextVersion = existing ? existing.version + 1 : 1

        // Insert the exercise result
        const { data: result, error } = await supabaseAdmin
            .from('exercise_results')
            .insert({
                user_id: body.userId,
                exercise_type: body.exerciseType,
                selections: body.selections,
                free_text: body.freeText || null,
                completed_at: body.completedAt || new Date().toISOString(),
                version: nextVersion,
                generated_items: []
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to save exercise result:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            result: {
                id: result.id,
                userId: result.user_id,
                exerciseType: result.exercise_type,
                selections: result.selections,
                freeText: result.free_text,
                completedAt: result.completed_at,
                version: result.version
            }
        })

    } catch (error) {
        console.error('Exercise save error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET: Check exercise completion status for a user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json(
            { success: false, error: 'userId required' },
            { status: 400 }
        )
    }

    try {
        // Use the helper function to get completion status
        const { data, error } = await supabaseAdmin
            .rpc('get_exercise_completion_status', { p_user_id: userId })

        if (error) {
            console.error('Failed to get exercise status:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            status: data.map((row: {
                exercise_type: string
                completed: boolean
                last_completed_at: string | null
                version: number
            }) => ({
                exerciseType: row.exercise_type,
                completed: row.completed,
                lastCompletedAt: row.last_completed_at,
                version: row.version
            }))
        })

    } catch (error) {
        console.error('Exercise status error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
