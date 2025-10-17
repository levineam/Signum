/**
 * Diagnostic API: Check for and optionally clean up duplicate journal entries
 *
 * GET: Returns list of duplicate journal dates
 * POST: Removes duplicates, keeping only the most recent entry per date
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all journal entries for user
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, created_at, updated_at, metadata')
      .eq('user_id', user.id)
      .eq('note_type', 'journal-entry')
      .order('created_at', { ascending: false })

    if (notesError) {
      throw notesError
    }

    // Group by journalDate to find duplicates
    const dateGroups = new Map<string, typeof notes>()

    for (const note of notes || []) {
      const journalDate = note.metadata?.journalDate || note.created_at.split('T')[0]
      if (!dateGroups.has(journalDate)) {
        dateGroups.set(journalDate, [])
      }
      dateGroups.get(journalDate)!.push(note)
    }

    // Find dates with duplicates
    const duplicates = Array.from(dateGroups.entries())
      .filter(([_, entries]) => entries.length > 1)
      .map(([date, entries]) => ({
        date,
        count: entries.length,
        entries: entries.map(e => ({
          id: e.id,
          title: e.title,
          created_at: e.created_at,
          updated_at: e.updated_at
        }))
      }))

    return NextResponse.json({
      totalJournalEntries: notes?.length || 0,
      duplicateDates: duplicates.length,
      duplicates
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all journal entries for user
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('note_type', 'journal-entry')
      .order('created_at', { ascending: false })

    if (notesError) {
      throw notesError
    }

    // Group by journalDate
    const dateGroups = new Map<string, typeof notes>()

    for (const note of notes || []) {
      const journalDate = note.metadata?.journalDate || note.created_at.split('T')[0]
      if (!dateGroups.has(journalDate)) {
        dateGroups.set(journalDate, [])
      }
      dateGroups.get(journalDate)!.push(note)
    }

    // For each date with duplicates, keep the most recent (by updated_at) and delete the rest
    const deletedIds: string[] = []

    for (const [date, entries] of dateGroups.entries()) {
      if (entries.length > 1) {
        // Sort by updated_at descending (most recent first)
        const sorted = [...entries].sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )

        // Keep the first (most recent), delete the rest
        const toDelete = sorted.slice(1)

        for (const entry of toDelete) {
          const { error: deleteError } = await supabase
            .from('notes')
            .delete()
            .eq('id', entry.id)
            .eq('user_id', user.id) // Safety check

          if (!deleteError) {
            deletedIds.push(entry.id)
          } else {
            console.error(`Failed to delete ${entry.id}:`, deleteError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedIds.length,
      deletedIds,
      message: `Cleaned up ${deletedIds.length} duplicate journal entries`
    })
  } catch (error) {
    console.error('Error cleaning duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to clean up duplicates' },
      { status: 500 }
    )
  }
}
