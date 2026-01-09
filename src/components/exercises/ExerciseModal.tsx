'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EXERCISE_CONTENT, EXERCISE_DEFINITIONS } from '@/lib/exercises/definitions'
import { hasPublicSupabase } from '@/lib/supabase'
import { saveExerciseResult, getLatestExerciseResult } from '@/lib/exercises/exerciseService'
import type { ExerciseResult, ExerciseType } from '@/types/exercise'
import { useExerciseState } from '@/hooks/useExerciseState'
import { MultiSelectStep } from '@/components/exercises/steps/MultiSelectStep'
import { RankingStep } from '@/components/exercises/steps/RankingStep'
import { FreeTextStep } from '@/components/exercises/steps/FreeTextStep'
import { ExerciseDiscardDialog } from '@/components/exercises/ExerciseDiscardDialog'

interface ExerciseModalProps {
  exerciseType: ExerciseType
  isOpen: boolean
  onClose: () => void
  onComplete: (result: ExerciseResult) => Promise<void> | void
}

export function ExerciseModal({ exerciseType, isOpen, onClose, onComplete }: ExerciseModalProps) {
  const { user } = useAuth()
  const definition = EXERCISE_DEFINITIONS[exerciseType]
  const {
    state,
    currentStep,
    currentSelections,
    currentFreeText,
    canGoNext,
    canGoPrevious,
    next,
    previous,
    setSelectionsForStep,
    setFreeTextForStep,
    getFinalSelections,
    getStepFreeText,
    setIsSubmitting
  } = useExerciseState(definition)

  const [showDiscard, setShowDiscard] = useState(false)
  const [missionContext, setMissionContext] = useState<{ values: string[]; people: string[] }>({
    values: [],
    people: []
  })

  const totalSteps = definition.steps.length
  const currentStepNumber = state.currentStepIndex + 1
  const progressValue = useMemo(
    () => Math.round((currentStepNumber / totalSteps) * 100),
    [currentStepNumber, totalSteps]
  )

  useEffect(() => {
    if (!isOpen) {
      setShowDiscard(false)
      return
    }

    if (exerciseType !== 'mission' || !user) {
      setMissionContext({ values: [], people: [] })
      return
    }

    let isMounted = true

    if (!hasPublicSupabase()) {
      if (isMounted) {
        setMissionContext({ values: [], people: [] })
      }
      return () => {
        isMounted = false
      }
    }

    Promise.all([
      getLatestExerciseResult(user.id, 'values'),
      getLatestExerciseResult(user.id, 'people')
    ])
      .then(([valuesResult, peopleResult]) => {
        if (!isMounted) return
        setMissionContext({
          values: valuesResult?.selections.map((item) => item.name) ?? [],
          people: peopleResult?.selections.map((item) => item.name) ?? []
        })
      })
      .catch((error) => {
        console.warn('[ExerciseModal] Unable to load mission context', error)
      })

    return () => {
      isMounted = false
    }
  }, [exerciseType, isOpen, user])

  const hasProgress = useMemo(() => {
    const selections = Object.values(state.selectionsByStep).some((items) => items.length > 0)
    const freeText = Object.values(state.freeTextByStep).some((text) => text.trim().length > 0)
    return selections || freeText
  }, [state.freeTextByStep, state.selectionsByStep])

  const handleRequestClose = () => {
    if (state.isSubmitting) return
    if (hasProgress) {
      setShowDiscard(true)
      return
    }
    onClose()
  }

  const handleDiscard = () => {
    setShowDiscard(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to save your results')
      return
    }

    setIsSubmitting(true)
    try {
      const selections = getFinalSelections()
      const freeTextStep = definition.steps.find((step) => step.type === 'free-text')
      const freeText = freeTextStep ? getStepFreeText(freeTextStep.id).trim() : undefined

      const result = await saveExerciseResult({
        userId: user.id,
        exerciseType,
        selections,
        freeText,
        completedAt: new Date().toISOString()
      })

      await onComplete(result)
      toast.success('Beautiful. These will shape your writing journey.')
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    if (!currentStep) return null

    if (currentStep.type === 'multi-select') {
      const options = EXERCISE_CONTENT[exerciseType]
      return (
        <MultiSelectStep
          step={currentStep}
          options={options}
          selections={currentSelections}
          onChange={(nextSelections) => setSelectionsForStep(currentStep.id, nextSelections)}
        />
      )
    }

    if (currentStep.type === 'ranking') {
      return (
        <RankingStep
          selections={currentSelections}
          onChange={(nextSelections) => setSelectionsForStep(currentStep.id, nextSelections)}
        />
      )
    }

    if (currentStep.type === 'free-text') {
      return (
        <FreeTextStep
          step={currentStep}
          value={currentFreeText}
          onChange={(value) => setFreeTextForStep(currentStep.id, value)}
          context={exerciseType === 'mission' ? missionContext : undefined}
        />
      )
    }

    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleRequestClose() : null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{definition.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <span>Step {currentStepNumber} of {totalSteps}</span>
              <span>{currentStep?.title}</span>
            </div>
            <Progress value={progressValue} />
            {currentStep?.description ? (
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            ) : null}
            {renderStep()}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={canGoPrevious ? previous : handleRequestClose}
              disabled={state.isSubmitting}
            >
              {canGoPrevious ? 'Back' : 'Close'}
            </Button>
            <div className="flex gap-2">
              {!state.isComplete ? (
                <Button onClick={next} disabled={!canGoNext || state.isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canGoNext || state.isSubmitting}>
                  {state.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Complete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseDiscardDialog
        isOpen={showDiscard}
        onContinue={() => setShowDiscard(false)}
        onDiscard={handleDiscard}
      />
    </>
  )
}
