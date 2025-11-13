'use client'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'

export function AppHeader() {
  const { loading } = useAuth()

  // Diagnostic: This runs during render, proving component mounted
  const renderTimestamp = Date.now()

  // Log for CI diagnostics - will show if component renders at all
  if (typeof window !== 'undefined') {
    console.log('[AppHeader] Rendered at', renderTimestamp, 'loading:', loading)
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur"
      data-auth-ready={!loading ? 'true' : 'false'}
      data-auth-loading={loading ? 'true' : 'false'}
      data-render-timestamp={renderTimestamp}
    >
      <ThemeToggle />
    </header>
  )
}
