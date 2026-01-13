'use client'

import { ThemeToggle } from '@/components/theme/theme-toggle'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
      <span className="ml-[50px] rounded-md border border-border px-3 py-1 text-sm font-bold text-muted-foreground">
        Alpha v0.1
      </span>
      <ThemeToggle />
    </header>
  )
}
