'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { needsMigration } from '@/lib/migrations/migrateToSupabase'
import { MigrationModal } from '@/components/migration/MigrationModal'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMigration, setShowMigration] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Check if migration is needed
      if (session?.user && needsMigration()) {
        setShowMigration(true)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Check if migration is needed on auth state change
      if (session?.user && needsMigration()) {
        setShowMigration(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
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
      {showMigration && user && (
        <MigrationModal
          userId={user.id}
          onComplete={() => {
            setShowMigration(false)
            // Reload to fetch Supabase data
            window.location.reload()
          }}
          onSkip={() => setShowMigration(false)}
        />
      )}
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