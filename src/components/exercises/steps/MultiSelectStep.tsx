'use client'

/**
 * MultiSelectStep Component
 * Grid of selectable options organized by category
 */

import { useMemo } from 'react'
import { ExerciseOption, ExerciseSelection } from '@/lib/exercises/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface MultiSelectStepProps {
    options: ExerciseOption[]
    selections: ExerciseSelection[]
    onToggle: (option: ExerciseSelection) => void
    minSelections?: number
    maxSelections?: number
}

export function MultiSelectStep({
    options,
    selections,
    onToggle,
    minSelections = 1,
    maxSelections = Infinity
}: MultiSelectStepProps) {
    // Group options by category
    const groupedOptions = useMemo(() => {
        const groups: Record<string, ExerciseOption[]> = {}
        options.forEach(option => {
            if (!groups[option.category]) {
                groups[option.category] = []
            }
            groups[option.category].push(option)
        })
        return groups
    }, [options])

    const selectedIds = useMemo(() =>
        new Set(selections.map(s => s.id)),
        [selections]
    )

    const isAtMax = selections.length >= maxSelections

    return (
        <div className="space-y-6">
            {/* Selection counter */}
            <div className="text-center text-sm text-muted-foreground">
                <span className={cn(
                    "font-medium",
                    selections.length >= minSelections ? "text-green-600 dark:text-green-400" : ""
                )}>
                    {selections.length}
                </span>
                {maxSelections < Infinity && (
                    <span> / {maxSelections}</span>
                )}
                <span> selected</span>
                {selections.length < minSelections && (
                    <span className="text-amber-600 dark:text-amber-400"> (select at least {minSelections})</span>
                )}
            </div>

            {/* Category groups */}
            {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categoryOptions.map(option => {
                            const isSelected = selectedIds.has(option.id)
                            const isDisabled = !isSelected && isAtMax

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => onToggle(option as ExerciseSelection)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "relative p-3 rounded-lg border text-left transition-all",
                                        "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        isSelected && "border-primary bg-primary/10 dark:bg-primary/20",
                                        !isSelected && !isDisabled && "border-border hover:bg-accent/50",
                                        isDisabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    title={option.description}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isSelected && "text-primary"
                                        )}>
                                            {option.name}
                                        </span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-primary shrink-0" />
                                        )}
                                    </div>
                                    {option.description && (
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                            {option.description}
                                        </p>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
