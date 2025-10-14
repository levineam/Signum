'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOGGLE_CLASSES =
  'peer focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50'

const THUMB_CLASSES =
  'pointer-events-none flex size-5 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'

const ICON_SIZE = 'size-3'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted/60" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'
  const iconClass = cn(ICON_SIZE, isDark ? 'text-foreground' : 'text-muted-foreground')

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      data-state={isDark ? 'checked' : 'unchecked'}
      onClick={handleToggle}
      className={cn(
        TOGGLE_CLASSES,
        isDark ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}
    >
      <span data-state={isDark ? 'checked' : 'unchecked'} className={THUMB_CLASSES}>
        {isDark ? <Moon className={iconClass} aria-hidden="true" /> : <Sun className={iconClass} aria-hidden="true" />}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
