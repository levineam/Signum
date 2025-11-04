/**
 * Story 2.4.7: Ontology Update Notifications
 * API endpoint to mark ontology updates as viewed
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
})

export async function POST() {
  // Create Supabase client with server-side cookies
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

  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.warn({ authError }, 'Unauthorized access attempt to mark-viewed endpoint')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info({ userId: user.id }, 'Marking ontology updates as viewed')

  try {
    // Mark all unviewed updates as viewed for this user
    const { error: updateError } = await supabase
      .from('ontology_updates')
      .update({ viewed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('viewed_at', null)

    if (updateError) {
      logger.error({ error: updateError, userId: user.id }, 'Failed to mark updates as viewed')
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    logger.info({ userId: user.id }, 'Successfully marked updates as viewed')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Unexpected error in mark-viewed endpoint')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
