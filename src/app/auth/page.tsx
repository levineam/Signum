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
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect param, validate it's a relative path (security: prevent open redirect)
  const getRedirectUrl = () => {
    const redirect = searchParams.get('redirect')
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect
    }
    return '/'
  }

  useEffect(() => {
    // Mark user as having visited the auth page
    localStorage.setItem('signum_has_visited', 'true')
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push(getRedirectUrl())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router, searchParams])

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

        <AuthForms
          mode={mode}
          onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        />
      </div>
    </div>
  )
}