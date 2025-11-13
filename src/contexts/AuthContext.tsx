'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
    if (TEST_MODE) {
      const stubUser = createTestUser()
      setUser(stubUser)
      setSession(createTestSession(stubUser))
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (TEST_MODE) {
      const stubUser = createTestUser()
      setUser(stubUser)
      setSession(createTestSession(stubUser))
      return { data: { user: stubUser }, error: null }
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
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (TEST_MODE) {
      return { data: { email }, error: null }
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
