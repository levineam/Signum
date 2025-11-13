'use client'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'

export function AppHeader() {
  const { loading } = useAuth()

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur"
      data-auth-ready={!loading}
    >
      <ThemeToggle />
    </header>
  )
}
