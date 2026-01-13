import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Allowlist of valid redirect hosts to prevent open redirect attacks
const ALLOWED_HOSTS = [
  'ontology-mu.vercel.app',
  'signum-im11dbdvv-levineams-projects.vercel.app',
  'localhost',
]

function isAllowedHost(host: string): boolean {
  const normalizedHost = host.trim().toLowerCase()
  return ALLOWED_HOSTS.some(allowed =>
    normalizedHost === allowed || normalizedHost.endsWith(`.${allowed}`)
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (user cancelled, provider error, etc.)
  if (error) {
    const errorMessage = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/auth?error=${errorMessage}`)
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(`${origin}/auth?error=Configuration%20error`)
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // Handle forwarded host for production environments behind load balancers
    // Validate against allowlist to prevent open redirect attacks
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}/`)
    } else if (forwardedHost && isAllowedHost(forwardedHost)) {
      return NextResponse.redirect(`https://${forwardedHost}/`)
    } else {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // No code provided - redirect to auth page with error
  return NextResponse.redirect(`${origin}/auth?error=No%20authorization%20code%20provided`)
}
