'use client'

import { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MOCK_REMINDERS = [
  { id: '1', text: 'Review weekly goals', time: '9:00 AM' },
  { id: '2', text: 'Meditation practice', time: '7:00 AM' },
]

export function DailyRemindersPrimer() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card spacing="compact" className="p-4">
      <Button
        variant="ghost"
        className="w-full justify-start px-2"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="daily-reminders-primer-content"
      >
        <Bell className="h-5 w-5 mr-3" />
        <span className="text-lg whitespace-nowrap">Daily Reminders</span>
        {MOCK_REMINDERS.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs tabular-nums min-w-[1.75rem] justify-center">
            {MOCK_REMINDERS.length}
          </Badge>
        )}
        <ChevronDown className={cn('h-4 w-4 ml-2 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div id="daily-reminders-primer-content" className="mt-3 space-y-2">
          {MOCK_REMINDERS.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-2">No reminders set</p>
          ) : (
            MOCK_REMINDERS.map((reminder) => (
              <div
                key={reminder.id}
                className="w-full flex items-start gap-2 px-3 py-2 rounded-md text-base bg-muted/20 border"
              >
                <div className="flex-1 min-w-0">
                  <p className="whitespace-normal break-words">{reminder.text}</p>
                  <p className="text-xs text-muted-foreground">{reminder.time}</p>
                </div>
              </div>
            ))
          )}

          <Button variant="ghost" size="sm" className="w-full text-sm text-muted-foreground hover:text-foreground">
            + Add Reminder
          </Button>
        </div>
      )}
    </Card>
  )
}


