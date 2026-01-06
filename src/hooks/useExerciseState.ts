/**
 * useExerciseState Hook
 * Manages state for micro-exercise flow
 */

import { useState, useCallback, useMemo } from 'react'
import {
    ExerciseDefinition,
    ExerciseSelection,
    ExerciseState,
    ExerciseResult
} from '@/lib/exercises/types'

interface UseExerciseStateProps {
    exercise: ExerciseDefinition
    userId: string
    onComplete?: (result: ExerciseResult) => void
}

interface UseExerciseStateReturn extends ExerciseState {
    // Navigation
    nextStep: () => void
    previousStep: () => void
    canGoNext: boolean
    canGoPrevious: boolean

    // Current step info
    currentStep: ExerciseDefinition['steps'][number]
    totalSteps: number
    progress: number

    // Selection management
    toggleSelection: (option: ExerciseSelection) => void
    setRanking: (selections: ExerciseSelection[]) => void
    setFreeText: (text: string) => void
    getCurrentSelections: () => ExerciseSelection[]
    getCurrentFreeText: () => string

    // Completion
    submit: () => Promise<void>
    reset: () => void
}

export function useExerciseState({
    exercise,
    userId,
    onComplete
}: UseExerciseStateProps): UseExerciseStateReturn {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [selectionsByStep, setSelectionsByStep] = useState<Record<string, ExerciseSelection[]>>({})
    const [freeTextByStep, setFreeTextByStep] = useState<Record<string, string>>({})
    const [isComplete, setIsComplete] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentStep = exercise.steps[currentStepIndex]
    const totalSteps = exercise.steps.length
    const progress = ((currentStepIndex + 1) / totalSteps) * 100

    // Get selections for current step, using previous step's if configured
    const getCurrentSelections = useCallback((): ExerciseSelection[] => {
        if (currentStep.usesPreviousSelections && currentStepIndex > 0) {
            const prevStepId = exercise.steps[currentStepIndex - 1].id
            return selectionsByStep[currentStep.id] || selectionsByStep[prevStepId] || []
        }
        return selectionsByStep[currentStep.id] || []
    }, [currentStep, currentStepIndex, exercise.steps, selectionsByStep])

    const getCurrentFreeText = useCallback((): string => {
        return freeTextByStep[currentStep.id] || ''
    }, [currentStep.id, freeTextByStep])

    // Check if current step is valid
    const isCurrentStepValid = useMemo(() => {
        const selections = getCurrentSelections()
        const freeText = getCurrentFreeText()

        switch (currentStep.inputType) {
            case 'multi-select':
                const minSel = currentStep.minSelections || 1
                const maxSel = currentStep.maxSelections || Infinity
                return selections.length >= minSel && selections.length <= maxSel

            case 'ranking':
                const requiredRank = currentStep.minSelections || 3
                return selections.length >= requiredRank

            case 'free-text':
                return freeText.trim().length > 0

            default:
                return true
        }
    }, [currentStep, getCurrentSelections, getCurrentFreeText])

    const canGoNext = isCurrentStepValid
    const canGoPrevious = currentStepIndex > 0

    const nextStep = useCallback(() => {
        if (currentStepIndex < totalSteps - 1) {
            // For ranking steps, copy previous selections if not already set
            const nextStepDef = exercise.steps[currentStepIndex + 1]
            if (nextStepDef.usesPreviousSelections && !selectionsByStep[nextStepDef.id]) {
                const currentSelections = getCurrentSelections()
                setSelectionsByStep(prev => ({
                    ...prev,
                    [nextStepDef.id]: currentSelections
                }))
            }
            setCurrentStepIndex(prev => prev + 1)
        }
    }, [currentStepIndex, totalSteps, exercise.steps, getCurrentSelections, selectionsByStep])

    const previousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }, [currentStepIndex])

    const toggleSelection = useCallback((option: ExerciseSelection) => {
        setSelectionsByStep(prev => {
            const stepId = currentStep.id
            const current = prev[stepId] || []
            const exists = current.some(s => s.id === option.id)

            if (exists) {
                return {
                    ...prev,
                    [stepId]: current.filter(s => s.id !== option.id)
                }
            } else {
                // Check max selections
                const maxSel = currentStep.maxSelections || Infinity
                if (current.length >= maxSel) {
                    return prev
                }
                return {
                    ...prev,
                    [stepId]: [...current, option]
                }
            }
        })
    }, [currentStep])

    const setRanking = useCallback((selections: ExerciseSelection[]) => {
        // Add rank to each selection based on position
        const ranked = selections.map((s, i) => ({ ...s, rank: i + 1 }))
        setSelectionsByStep(prev => ({
            ...prev,
            [currentStep.id]: ranked
        }))
    }, [currentStep.id])

    const setFreeText = useCallback((text: string) => {
        setFreeTextByStep(prev => ({
            ...prev,
            [currentStep.id]: text
        }))
    }, [currentStep.id])

    const submit = useCallback(async () => {
        setIsSubmitting(true)

        try {
            // Gather all selections from all steps
            const allSelections: ExerciseSelection[] = []
            let primaryFreeText = ''

            exercise.steps.forEach(step => {
                const stepSelections = selectionsByStep[step.id] || []
                if (step.inputType === 'ranking' ||
                    (step.inputType === 'multi-select' && step === exercise.steps[exercise.steps.length - 1])) {
                    // Use final selections
                    allSelections.push(...stepSelections)
                }
                if (step.inputType === 'free-text') {
                    primaryFreeText = freeTextByStep[step.id] || ''
                }
            })

            const result: ExerciseResult = {
                userId,
                exerciseType: exercise.id,
                selections: allSelections,
                freeText: primaryFreeText || undefined,
                completedAt: new Date().toISOString(),
                version: 1
            }

            // Call save API
            const response = await fetch('/api/exercises/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            })

            if (!response.ok) {
                throw new Error('Failed to save exercise result')
            }

            const savedResult = await response.json()

            setIsComplete(true)
            onComplete?.(savedResult)
        } finally {
            setIsSubmitting(false)
        }
    }, [exercise, selectionsByStep, freeTextByStep, userId, onComplete])

    const reset = useCallback(() => {
        setCurrentStepIndex(0)
        setSelectionsByStep({})
        setFreeTextByStep({})
        setIsComplete(false)
        setIsSubmitting(false)
    }, [])

    return {
        // State
        currentStepIndex,
        selectionsByStep,
        freeTextByStep,
        isComplete,
        isSubmitting,

        // Navigation
        nextStep,
        previousStep,
        canGoNext,
        canGoPrevious,

        // Current step info
        currentStep,
        totalSteps,
        progress,

        // Selection management
        toggleSelection,
        setRanking,
        setFreeText,
        getCurrentSelections,
        getCurrentFreeText,

        // Completion
        submit,
        reset
    }
}
