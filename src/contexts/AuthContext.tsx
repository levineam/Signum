'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, hasPublicSupabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ data: unknown; error: unknown }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TEST_MODE = ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

function createTestUser(): User {
  const timestamp = new Date().toISOString()
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || 'dev-test-1@signum.dev',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: timestamp,
    email_confirmed_at: timestamp,
    phone: '',
    phone_confirmed_at: null,
    role: 'authenticated',
    updated_at: timestamp,
    last_sign_in_at: timestamp,
    factors: [],
    identities: [],
  } as unknown as User
}

function createTestSession(user: User): Session {
  return {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'test-refresh-token',
    user,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    let subscription: { unsubscribe: () => void } | null = null

    const shouldLog = TEST_MODE || process.env.NODE_ENV !== 'production'
    const log = (...args: unknown[]) => {
      if (shouldLog) {
        console.log('[AuthContext]', ...args)
      }
    }
    const warn = (...args: unknown[]) => {
      console.warn('[AuthContext]', ...args)
    }
    const finishLoading = (reason: string) => {
      if (!mounted) return
      log('finishLoading:', reason)
      setLoading(false)
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
    }

    fallbackTimer = setTimeout(() => {
      warn('Fallback timer fired - forcing loading=false after 5s')
      finishLoading('fallback')
    }, 5000)

    log('Initializing auth', { TEST_MODE, env: process.env.NEXT_PUBLIC_E2E_TEST_MODE })

    if (TEST_MODE) {
      log('Using test mode stub user')
      const stubUser = createTestUser()
      setUser(stubUser)
      setSession(createTestSession(stubUser))
      finishLoading('test-mode stub')
      return () => {
        mounted = false
        if (fallbackTimer) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
      }
    }

    if (!hasPublicSupabase()) {
      warn('Supabase environment variables not configured. Running in guest mode.')
      setUser(null)
      setSession(null)
      finishLoading('guest-mode')
      return () => {
        mounted = false
        if (fallbackTimer) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
      }
    }

    try {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (!mounted) return
          log('Initial session resolved', { hasSession: Boolean(session) })
          setSession(session)
          setUser(session?.user ?? null)
          finishLoading('getSession')
        })
        .catch((error) => {
          console.error('[AuthContext] getSession failed:', error)
          finishLoading('getSession-error')
        })

      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return
        log('Auth state changed', { hasSession: Boolean(session) })
        setSession(session)
        setUser(session?.user ?? null)
        finishLoading('auth-change')
      })

      subscription = authSubscription
    } catch (error) {
      console.error('[AuthContext] Error initializing Supabase auth:', error)
      finishLoading('init-error')
    }

    return () => {
      mounted = false
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (TEST_MODE) {
      const stubUser = createTestUser()
      setUser(stubUser)
      setSession(createTestSession(stubUser))
      return { data: { user: stubUser }, error: null }
    }
    if (!hasPublicSupabase()) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    if (TEST_MODE) {
      const stubUser = createTestUser()
      setUser(stubUser)
      setSession(createTestSession(stubUser))
      return { data: { user: stubUser }, error: null }
    }

    if (!hasPublicSupabase()) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    console.log('SignIn called with:', { email: email ? 'present' : 'missing', password: password ? 'present' : 'missing' })

    if (!email || !password) {
      console.error('Missing email or password:', { email, password })
      return {
        data: null,
        error: { message: 'Email and password are required' }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('SignIn error:', error)
    }

    return { data, error }
  }

  const signOut = async () => {
    if (TEST_MODE) {
      setUser(null)
      setSession(null)
      return
    }
    if (!hasPublicSupabase()) {
      setUser(null)
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (TEST_MODE) {
      return { data: { email }, error: null }
    }
    if (!hasPublicSupabase()) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
