'use client'

import { cn } from '@/lib/utils'
import type { ExerciseStep } from '@/types/exercise'

interface FreeTextContext {
  values?: string[]
  people?: string[]
}

interface FreeTextStepProps {
  step: ExerciseStep
  value: string
  onChange: (value: string) => void
  context?: FreeTextContext
}

export function FreeTextStep({ step, value, onChange, context }: FreeTextStepProps) {
  const values = context?.values ?? []
  const people = context?.people ?? []

  return (
    <div className="space-y-4">
      {(values.length > 0 || people.length > 0) && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Your context
          </div>
          <div className="mt-3 space-y-2">
            {values.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Your values</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {values.map((item) => (
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
            {people.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Who matters most</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {people.map((item) => (
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
