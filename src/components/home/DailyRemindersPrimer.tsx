'use client'

import { useState } from 'react'
import { Bell, ChevronDown, Check, Trash2, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useItems, useCompleteItem, useDeleteItem } from '@/hooks/useItems'
import { CreateItemModal } from '@/components/home/CreateItemModal'
import type { Item } from '@/types/temporal'
import { format } from 'date-fns'

function formatReminderTime(item: Item): string {
  if (item.reminderTime) {
    try {
      const date = new Date(item.reminderTime)
      if (isNaN(date.getTime())) return ''
      return format(date, 'h:mm a')
    } catch {
      return ''
    }
  }
  if (item.dueAt) {
    try {
      const date = new Date(item.dueAt)
      if (isNaN(date.getTime())) return ''
      return format(date, 'h:mm a')
    } catch {
      return ''
    }
  }
  return ''
}

export function DailyRemindersPrimer() {
  const [isOpen, setIsOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: reminders = [], isLoading } = useItems({
    itemType: 'reminder',
    status: 'pending',
  })

  const { mutate: completeItem, isPending: isCompleting } = useCompleteItem()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem()

  const handleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    completeItem(id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteItem(id)
  }

  return (
    <>
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
          {reminders.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto text-xs tabular-nums min-w-[1.75rem] justify-center"
            >
              {reminders.length}
            </Badge>
          )}
          <ChevronDown
            className={cn('h-4 w-4 ml-2 transition-transform', isOpen && 'rotate-180')}
          />
        </Button>

        {isOpen && (
          <div id="daily-reminders-primer-content" className="mt-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">No reminders set</p>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="w-full flex items-start gap-2 px-3 py-2 rounded-md text-base bg-muted/20 border group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-normal break-words">{reminder.title}</p>
                    {formatReminderTime(reminder) && (
                      <p className="text-xs text-muted-foreground">
                        {formatReminderTime(reminder)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleComplete(reminder.id, e)}
                      disabled={isCompleting}
                      title="Complete"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(reminder.id, e)}
                      disabled={isDeleting}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Reminder
            </Button>
          </div>
        )}
      </Card>

      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        itemType="reminder"
      />
    </>
  )
}
