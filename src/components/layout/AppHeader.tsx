'use client'

import { ThemeToggle } from '@/components/theme/theme-toggle'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
      <ThemeToggle />
    </header>
  )
}
