'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateItem } from '@/hooks/useItems'
import type { ItemType, PriorityLevel } from '@/types/temporal'
import { Bell, CheckSquare, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: ItemType
}

export function CreateItemModal({ isOpen, onClose, itemType }: CreateItemModalProps) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>('medium')

  const { mutate: createItem, isPending } = useCreateItem()

  const handleSubmit = () => {
    if (!title.trim()) return

    createItem(
      {
        itemType,
        title: title.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        priority: itemType === 'task' ? priority : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${itemType === 'task' ? 'Todo' : 'Reminder'} created`)
          handleClose()
        },
        onError: (error) => {
          toast.error('Failed to create item', { description: error.message })
        },
      }
    )
  }

  const handleClose = () => {
    setTitle('')
    setDueAt('')
    setPriority('medium')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {itemType === 'reminder' ? (
              <Bell className="h-5 w-5" />
            ) : (
              <CheckSquare className="h-5 w-5" />
            )}
            Create {itemType === 'reminder' ? 'Reminder' : 'Todo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="item-title">Title</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                itemType === 'reminder' ? 'What to remember...' : 'What needs to be done?'
              }
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-due">
              {itemType === 'reminder' ? 'Remind at' : 'Due date'} (optional)
            </Label>
            <Input
              id="item-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          {itemType === 'task' && (
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className="capitalize flex-1"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
