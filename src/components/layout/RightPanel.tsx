'use client'

import { DailyRemindersPrimer } from '@/components/home/DailyRemindersPrimer'
import { TodosPrimer } from '@/components/home/TodosPrimer'
import { cn } from '@/lib/utils'

interface RightPanelProps {
  className?: string
}

export function RightPanel({ className }: RightPanelProps) {
  return (
    <aside
      className={cn(
        // Fixed position on right, starting below header (64px = 4rem)
        'fixed right-0 top-16 h-[calc(100dvh-4rem)]',
        // Width: 320px (w-80)
        'w-80',
        // Styling to match sidebar
        'bg-sidebar border-l border-sidebar-border',
        // Padding and spacing
        'p-4 overflow-y-auto',
        // Z-index below header (z-30) to avoid blocking header interactions
        'z-20',
        // Hidden below lg breakpoint (1024px)
        'hidden lg:flex lg:flex-col',
        // Smooth transitions
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      <div className="space-y-4">
        <DailyRemindersPrimer />
        <TodosPrimer />
      </div>
    </aside>
  )
}
