'use client'

import { OntologyInsightCard } from '@/components/home/OntologyInsightCard'
import { DailyRemindersPrimer } from '@/components/home/DailyRemindersPrimer'
import { TodosPrimer } from '@/components/home/TodosPrimer'

export function HomepagePrimer() {
  return (
    <div className="max-w-4xl mx-auto p-6 pb-0 space-y-6" data-homepage-primer>
      {/* Single insight card — warm, curious writing spark (no title by design) */}
      <OntologyInsightCard />

      <div className="grid gap-6 md:grid-cols-2">
        <DailyRemindersPrimer />
        <TodosPrimer />
      </div>
    </div>
  )
}


