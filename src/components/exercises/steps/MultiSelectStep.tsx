'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ExerciseSelection, ExerciseStep, SelectionItem } from '@/types/exercise'

interface MultiSelectStepProps {
  step: ExerciseStep
  options: SelectionItem[]
  selections: ExerciseSelection[]
  onChange: (next: ExerciseSelection[]) => void
}

export function MultiSelectStep({ step, options, selections, onChange }: MultiSelectStepProps) {
  const selectedIds = useMemo(() => new Set(selections.map((item) => item.id)), [selections])
  const maxSelections = step.maxSelections

  const grouped = useMemo(() => {
    const map = new Map<string, SelectionItem[]>()
    options.forEach((item) => {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    })
    return Array.from(map.entries())
  }, [options])

  const toggleSelection = (item: SelectionItem) => {
    const isSelected = selectedIds.has(item.id)

    if (isSelected) {
      onChange(selections.filter((selection) => selection.id !== item.id))
      return
    }

    if (typeof maxSelections === 'number' && selections.length >= maxSelections) {
      return
    }

    onChange([...selections, { ...item }])
  }

  const selectionCountLabel = typeof maxSelections === 'number'
    ? `${selections.length}/${maxSelections} selected`
    : `${selections.length} selected`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{selectionCountLabel}</span>
        {step.minSelections ? (
          <span>Pick at least {step.minSelections}</span>
        ) : null}
      </div>

      {grouped.map(([category, items]) => (
        <div key={category} className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {category}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id)
              const isDisabled = !isSelected && typeof maxSelections === 'number' && selections.length >= maxSelections

              const card = (
                <button
                  type="button"
                  onClick={() => toggleSelection(item)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                    'group w-full rounded-lg border px-4 py-3 text-left transition-all',
                    'hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
                    isSelected ? 'border-primary/60 bg-primary/10 shadow-sm' : 'border-border bg-background',
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  {item.description ? (
                    <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                  ) : null}
                  {item.clarifyingQuestion ? (
                    <div className="text-xs text-muted-foreground mt-2 italic opacity-0 transition-opacity group-hover:opacity-100">
                      {item.clarifyingQuestion}
                    </div>
                  ) : null}
                </button>
              )

              return <div key={item.id}>{card}</div>
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
