'use client'

import { cn } from '@/lib/utils'
import type { ExerciseStep } from '@/types/exercise'

interface FreeTextContext {
  strengths?: string[]
  impact?: string[]
}

interface FreeTextStepProps {
  step: ExerciseStep
  value: string
  onChange: (value: string) => void
  context?: FreeTextContext
}

export function FreeTextStep({ step, value, onChange, context }: FreeTextStepProps) {
  const strengths = context?.strengths ?? []
  const impact = context?.impact ?? []

  return (
    <div className="space-y-4">
      {(strengths.length > 0 || impact.length > 0) && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Your context
          </div>
          <div className="mt-3 space-y-2">
            {strengths.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Strengths</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {strengths.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {impact.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Who you want to help</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {impact.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          className={cn(
            'min-h-[160px] w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40'
          )}
          placeholder={step.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{step.placeholder ? 'Use your own words.' : ''}</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  )
}
