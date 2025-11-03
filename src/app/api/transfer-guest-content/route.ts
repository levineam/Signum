import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client (inside function to avoid build-time errors)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[transfer-guest-content] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get session from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - no authorization header' },
        { status: 401 }
      )
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '')

    // Verify the session using the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('[transfer-guest-content] Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    console.log('[transfer-guest-content] Authenticated user:', user.id)

    // Parse request body
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request - content is required and must be a string' },
        { status: 400 }
      )
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content)

    if (sanitizedContent.length > 100000) {
      return NextResponse.json(
        { error: 'Content too large - maximum 100KB allowed' },
        { status: 400 }
      )
    }

    // Get today's date in local timezone
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`

    // Check if today's entry already exists for this user
    const { data: existingNotes, error: fetchError } = await supabaseAdmin
      .from('notes')
      .select('id, metadata')
      .eq('user_id', user.id)
      .eq('note_type', 'journal-entry')

    if (fetchError) {
      console.error('[transfer-guest-content] Error fetching existing entries:', fetchError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Find today's entry by checking journalDate in metadata
    const todayEntry = existingNotes.find(note => {
      const meta = note.metadata as { journalDate?: string } | null
      return meta?.journalDate === today
    })

    if (todayEntry) {
      // Update existing entry
      console.log('[transfer-guest-content] Updating existing entry:', todayEntry.id)

      const { error: updateError } = await supabaseAdmin
        .from('notes')
        .update({
          content: sanitizedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', todayEntry.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[transfer-guest-content] Error updating entry:', updateError)
        return NextResponse.json(
          { error: 'Failed to update journal entry' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        entryId: todayEntry.id,
        updated: true
      })
    } else {
      // Create new entry
      console.log('[transfer-guest-content] Creating new entry for user:', user.id)

      const { data: newNote, error: insertError } = await supabaseAdmin
        .from('notes')
        .insert({
          user_id: user.id,
          title: `Journal Entry - ${today}`,
          content: sanitizedContent,
          note_type: 'journal-entry',
          metadata: {
            journalDate: today
          }
        })
        .select()
        .single()

      if (insertError || !newNote) {
        console.error('[transfer-guest-content] Error creating entry:', insertError)
        return NextResponse.json(
          { error: 'Failed to create journal entry' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        entryId: newNote.id,
        updated: false
      })
    }
  } catch (error) {
    console.error('[transfer-guest-content] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
