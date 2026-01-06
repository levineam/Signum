'use client'

/**
 * MicroExerciseModal Component
 * Main dialog for micro-exercises with step navigation
 */

import { useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sparkles, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'

import { ExerciseDefinition, ExerciseResult } from '@/lib/exercises/types'
import { useExerciseState } from '@/hooks/useExerciseState'
import { MultiSelectStep } from './steps/MultiSelectStep'
import { RankingStep } from './steps/RankingStep'
import { FreeTextStep } from './steps/FreeTextStep'
import { cn } from '@/lib/utils'

interface MicroExerciseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    exercise: ExerciseDefinition
    userId: string
    onComplete?: (result: ExerciseResult) => void
}

export function MicroExerciseModal({
    open,
    onOpenChange,
    exercise,
    userId,
    onComplete
}: MicroExerciseModalProps) {
    const state = useExerciseState({
        exercise,
        userId,
        onComplete: (result) => {
            onComplete?.(result)
        }
    })

    const handleClose = useCallback(() => {
        state.reset()
        onOpenChange(false)
    }, [state, onOpenChange])

    const handleComplete = useCallback(async () => {
        await state.submit()
    }, [state])

    const isLastStep = state.currentStepIndex === state.totalSteps - 1

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                            {exercise.estimatedDuration}
                        </span>
                    </div>
                    <DialogTitle className="text-2xl">{exercise.title}</DialogTitle>
                    <DialogDescription>{exercise.subtitle}</DialogDescription>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Step {state.currentStepIndex + 1} of {state.totalSteps}</span>
                        <span>{Math.round(state.progress)}% complete</span>
                    </div>
                    <Progress value={state.progress} className="h-2" />
                </div>

                {/* Step content */}
                <div className="py-4">
                    {state.isComplete ? (
                        <CompletionView
                            message={exercise.completionMessage}
                            onClose={handleClose}
                        />
                    ) : (
                        <>
                            {/* Step title and description */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-1">
                                    {state.currentStep.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {state.currentStep.description}
                                </p>
                            </div>

                            {/* Step-specific input */}
                            {state.currentStep.inputType === 'multi-select' && (
                                <MultiSelectStep
                                    options={state.currentStep.options || []}
                                    selections={state.getCurrentSelections()}
                                    onToggle={state.toggleSelection}
                                    minSelections={state.currentStep.minSelections}
                                    maxSelections={state.currentStep.maxSelections}
                                />
                            )}

                            {state.currentStep.inputType === 'ranking' && (
                                <RankingStep
                                    selections={state.getCurrentSelections()}
                                    onRankingChange={state.setRanking}
                                    minSelections={state.currentStep.minSelections}
                                    maxSelections={state.currentStep.maxSelections}
                                />
                            )}

                            {state.currentStep.inputType === 'free-text' && (
                                <FreeTextStep
                                    value={state.getCurrentFreeText()}
                                    onChange={state.setFreeText}
                                    placeholder={state.currentStep.placeholder}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Navigation buttons */}
                {!state.isComplete && (
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                            variant="ghost"
                            onClick={state.previousStep}
                            disabled={!state.canGoPrevious}
                            className={cn(!state.canGoPrevious && "invisible")}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>

                        {isLastStep ? (
                            <Button
                                onClick={handleComplete}
                                disabled={!state.canGoNext || state.isSubmitting}
                                className="min-w-[120px]"
                            >
                                {state.isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Complete
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={state.nextStep}
                                disabled={!state.canGoNext}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// =============================================================================
// Completion View
// =============================================================================

interface CompletionViewProps {
    message: string
    onClose: () => void
}

function CompletionView({ message, onClose }: CompletionViewProps) {
    return (
        <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Done!</h3>
                <p className="text-muted-foreground">{message}</p>
            </div>
            <Button onClick={onClose} size="lg">
                Continue
            </Button>
        </div>
    )
}
