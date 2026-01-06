'use client'

/**
 * RankingStep Component
 * Drag-and-drop ranking interface
 */

import { useState, useCallback } from 'react'
import { ExerciseSelection } from '@/lib/exercises/types'
import { cn } from '@/lib/utils'
import { GripVertical, X } from 'lucide-react'

interface RankingStepProps {
    selections: ExerciseSelection[]
    onRankingChange: (selections: ExerciseSelection[]) => void
    minSelections?: number
    maxSelections?: number
}

export function RankingStep({
    selections,
    onRankingChange,
    minSelections = 3,
    maxSelections = 5
}: RankingStepProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    // Take only the first maxSelections items
    const rankedItems = selections.slice(0, maxSelections)
    const availableItems = selections.slice(maxSelections)

    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        const newSelections = [...rankedItems]
        const [removed] = newSelections.splice(draggedIndex, 1)
        newSelections.splice(index, 0, removed)

        setDraggedIndex(index)
        onRankingChange([...newSelections, ...availableItems])
    }, [draggedIndex, rankedItems, availableItems, onRankingChange])

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null)
    }, [])

    const moveUp = useCallback((index: number) => {
        if (index === 0) return
        const newSelections = [...rankedItems]
            ;[newSelections[index - 1], newSelections[index]] = [newSelections[index], newSelections[index - 1]]
        onRankingChange([...newSelections, ...availableItems])
    }, [rankedItems, availableItems, onRankingChange])

    const moveDown = useCallback((index: number) => {
        if (index === rankedItems.length - 1) return
        const newSelections = [...rankedItems]
            ;[newSelections[index], newSelections[index + 1]] = [newSelections[index + 1], newSelections[index]]
        onRankingChange([...newSelections, ...availableItems])
    }, [rankedItems, availableItems, onRankingChange])

    const removeFromRanking = useCallback((index: number) => {
        const newRanked = [...rankedItems]
        const [removed] = newRanked.splice(index, 1)
        onRankingChange([...newRanked, ...availableItems, removed])
    }, [rankedItems, availableItems, onRankingChange])

    const addToRanking = useCallback((item: ExerciseSelection) => {
        if (rankedItems.length >= maxSelections) return
        const newAvailable = availableItems.filter(i => i.id !== item.id)
        onRankingChange([...rankedItems, item, ...newAvailable])
    }, [rankedItems, availableItems, maxSelections, onRankingChange])

    return (
        <div className="space-y-6">
            {/* Status indicator */}
            <div className="text-center text-sm text-muted-foreground">
                <span className={cn(
                    "font-medium",
                    rankedItems.length >= minSelections ? "text-green-600 dark:text-green-400" : ""
                )}>
                    {rankedItems.length}
                </span>
                <span> / {maxSelections} ranked</span>
                {rankedItems.length < minSelections && (
                    <span className="text-amber-600 dark:text-amber-400"> (need at least {minSelections})</span>
                )}
            </div>

            {/* Ranked items */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Your top {maxSelections}</h4>
                {rankedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        Drag items here or click to add them
                    </p>
                ) : (
                    <div className="space-y-2">
                        {rankedItems.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                                    "cursor-grab active:cursor-grabbing",
                                    draggedIndex === index && "opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium">{item.name}</span>
                                    {item.category && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="p-1 rounded hover:bg-accent disabled:opacity-30"
                                        aria-label="Move up"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === rankedItems.length - 1}
                                        className="p-1 rounded hover:bg-accent disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => removeFromRanking(index)}
                                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                        aria-label="Remove"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available items */}
            {availableItems.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Other selections (click to add)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {availableItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToRanking(item)}
                                disabled={rankedItems.length >= maxSelections}
                                className={cn(
                                    "px-3 py-1.5 rounded-full border text-sm",
                                    "hover:border-primary hover:bg-primary/10",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
