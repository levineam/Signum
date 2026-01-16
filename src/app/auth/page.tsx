'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForms } from '@/components/auth/AuthForms'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    // Default to signup for new users, signin for returning users
    if (typeof window === 'undefined') return 'signup'
    const hasVisited = localStorage.getItem('signum_has_visited')
    return hasVisited ? 'signin' : 'signup'
  })
  const [oauthError, setOauthError] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Mark user as having visited the auth page
    localStorage.setItem('signum_has_visited', 'true')
  }, [])

  // Check for OAuth error in URL params
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      // searchParams.get() already returns decoded string, no need to decode again
      setOauthError(error)
      // Clear error from URL without triggering navigation
      window.history.replaceState({}, '', '/auth')
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Signum</h1>
          <p className="text-muted-foreground">Build your personal ontology</p>
        </div>

        {/* OAuth error display */}
        {oauthError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{oauthError}</p>
          </div>
        )}

        <AuthForms
          mode={mode}
          onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        />
      </div>
    </div>
  )
}