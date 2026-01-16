'use client'

import { OntologyInsightCard } from '@/components/home/OntologyInsightCard'
import { DailyRemindersPrimer } from '@/components/home/DailyRemindersPrimer'
import { TodosPrimer } from '@/components/home/TodosPrimer'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function HomepagePrimer() {
  // Check if we're on desktop (where right panel is visible)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="max-w-4xl mx-auto p-6 pb-0 space-y-6" data-homepage-primer>
      {/* Single insight card — warm, curious writing spark (no title by design) */}
      <OntologyInsightCard />

      {/* On mobile/tablet only: show reminders/todos inline (on desktop they're in RightPanel) */}
      {!isDesktop && (
        <div className="grid gap-6 md:grid-cols-2">
          <DailyRemindersPrimer />
          <TodosPrimer />
        </div>
      )}
    </div>
  )
}
