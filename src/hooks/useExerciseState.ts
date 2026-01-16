import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ExerciseDefinition, ExerciseSelection } from '@/types/exercise'

interface ExerciseState {
  currentStepIndex: number
  selectionsByStep: Record<string, ExerciseSelection[]>
  freeTextByStep: Record<string, string>
  isComplete: boolean
  isSubmitting: boolean
}

export function useExerciseState(definition: ExerciseDefinition) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectionsByStep, setSelectionsByStep] = useState<Record<string, ExerciseSelection[]>>({})
  const [freeTextByStep, setFreeTextByStep] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStep = definition.steps[currentStepIndex]

  const canGoPrevious = currentStepIndex > 0

  const minSelections = currentStep?.minSelections ?? 0
  const maxSelections = currentStep?.maxSelections

  const currentSelections = selectionsByStep[currentStep?.id ?? ''] ?? []
  const currentFreeText = freeTextByStep[currentStep?.id ?? ''] ?? ''

  const canGoNext = useMemo(() => {
    if (!currentStep) return false
    if (currentStep.type === 'multi-select' || currentStep.type === 'ranking') {
      if (currentSelections.length < minSelections) return false
      if (typeof maxSelections === 'number' && currentSelections.length > maxSelections) return false
      return currentSelections.length > 0
    }
    if (currentStep.type === 'free-text') {
      return currentFreeText.trim().length > 0
    }
    return true
  }, [currentSelections.length, currentFreeText, currentStep, maxSelections, minSelections])

  const isComplete = currentStepIndex === definition.steps.length - 1

  const setSelectionsForStep = useCallback((stepId: string, selections: ExerciseSelection[]) => {
    setSelectionsByStep((prev) => ({ ...prev, [stepId]: selections }))
  }, [])

  const setFreeTextForStep = useCallback((stepId: string, text: string) => {
    setFreeTextByStep((prev) => ({ ...prev, [stepId]: text }))
  }, [])

  const next = useCallback(() => {
    if (!canGoNext) return
    setCurrentStepIndex((prev) => Math.min(prev + 1, definition.steps.length - 1))
  }, [canGoNext, definition.steps.length])

  const previous = useCallback(() => {
    if (!canGoPrevious) return
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }, [canGoPrevious])

  const getStepSelections = useCallback(
    (stepId: string) => selectionsByStep[stepId] ?? [],
    [selectionsByStep]
  )

  const getStepFreeText = useCallback(
    (stepId: string) => freeTextByStep[stepId] ?? '',
    [freeTextByStep]
  )

  const getFinalSelections = useCallback(() => {
    const rankingStep = definition.steps.find((step) => step.type === 'ranking')
    if (rankingStep) {
      const ranked = selectionsByStep[rankingStep.id]
      if (ranked && ranked.length) return ranked
    }

    const firstSelectionStep = definition.steps.find((step) => step.type === 'multi-select')
    if (firstSelectionStep) {
      return selectionsByStep[firstSelectionStep.id] ?? []
    }

    return []
  }, [definition.steps, selectionsByStep])

  useEffect(() => {
    if (!currentStep?.usesPreviousSelections) return
    const previousStep = definition.steps[currentStepIndex - 1]
    if (!previousStep) return

    const previousSelections = selectionsByStep[previousStep.id] ?? []
    const currentSelections = selectionsByStep[currentStep.id] ?? []

    if (!previousSelections.length) return

    if (!currentSelections.length) {
      setSelectionsByStep((prev) => ({ ...prev, [currentStep.id]: previousSelections }))
      return
    }

    const previousIds = new Set(previousSelections.map((item) => item.id))
    const filtered = currentSelections.filter((item) => previousIds.has(item.id))
    const missing = previousSelections.filter((item) => !filtered.find((existing) => existing.id === item.id))

    if (missing.length || filtered.length !== currentSelections.length) {
      setSelectionsByStep((prev) => ({ ...prev, [currentStep.id]: [...filtered, ...missing] }))
    }
  }, [currentStep, currentStepIndex, definition.steps, selectionsByStep])

  return {
    state: {
      currentStepIndex,
      selectionsByStep,
      freeTextByStep,
      isComplete,
      isSubmitting
    } as ExerciseState,
    currentStep,
    currentSelections,
    currentFreeText,
    canGoNext,
    canGoPrevious,
    next,
    previous,
    setSelectionsForStep,
    setFreeTextForStep,
    getStepSelections,
    getStepFreeText,
    getFinalSelections,
    setIsSubmitting
  }
}
