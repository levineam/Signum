'use client'

import { useState, type DragEvent } from 'react'
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExerciseSelection } from '@/types/exercise'

interface RankingStepProps {
  selections: ExerciseSelection[]
  onChange: (next: ExerciseSelection[]) => void
}

export function RankingStep({ selections, onChange }: RankingStepProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const move = (fromIndex: number, toIndex: number) => {
    const next = [...selections]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange(next)
  }

  const handleDragStart = (id: string) => {
    setDraggingId(id)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault()
    setDragOverId(id)
  }

  const handleDrop = (id: string) => {
    if (!draggingId || draggingId === id) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const fromIndex = selections.findIndex((item) => item.id === draggingId)
    const toIndex = selections.findIndex((item) => item.id === id)

    if (fromIndex !== -1 && toIndex !== -1) {
      move(fromIndex, toIndex)
    }

    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    move(index, index - 1)
  }

  const handleMoveDown = (index: number) => {
    if (index === selections.length - 1) return
    move(index, index + 1)
  }

  return (
    <div className="space-y-3" role="list">
      {selections.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
            draggingId === item.id ? 'border-primary/60 bg-primary/5' : 'border-border',
            dragOverId === item.id && draggingId !== item.id ? 'ring-2 ring-primary/30' : ''
          )}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragOver={(event) => handleDragOver(event, item.id)}
          onDrop={() => handleDrop(item.id)}
          onDragEnd={handleDragEnd}
          role="listitem"
          aria-grabbed={draggingId === item.id}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {index + 1}
          </div>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 text-sm font-medium text-foreground">{item.name}</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleMoveUp(index)}
              className="rounded-md border border-border p-1 text-muted-foreground transition hover:text-foreground"
              aria-label={`Move ${item.name} up`}
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveDown(index)}
              className="rounded-md border border-border p-1 text-muted-foreground transition hover:text-foreground"
              aria-label={`Move ${item.name} down`}
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      {selections.length === 0 && (
        <p className="text-sm text-muted-foreground">No selections yet.</p>
      )}
    </div>
  )
}
