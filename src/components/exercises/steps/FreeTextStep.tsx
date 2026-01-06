'use client'

/**
 * FreeTextStep Component
 * Textarea with prompt and placeholder
 */

import { cn } from '@/lib/utils'

interface FreeTextStepProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    minLength?: number
    maxLength?: number
}

export function FreeTextStep({
    value,
    onChange,
    placeholder = 'Share your thoughts...',
    minLength = 10,
    maxLength = 1000
}: FreeTextStepProps) {
    const charCount = value.length
    const isValid = charCount >= minLength
    const isNearMax = maxLength && charCount > maxLength * 0.9

    return (
        <div className="space-y-3">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={6}
                className={cn(
                    "w-full px-4 py-3 rounded-lg border bg-background",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "resize-none"
                )}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className={cn(
                    !isValid && charCount > 0 && "text-amber-600 dark:text-amber-400"
                )}>
                    {!isValid && charCount > 0 && (
                        `${minLength - charCount} more characters needed`
                    )}
                    {isValid && '✓ Good length'}
                </span>
                <span className={cn(
                    isNearMax && "text-amber-600 dark:text-amber-400"
                )}>
                    {charCount}{maxLength && ` / ${maxLength}`}
                </span>
            </div>

            {/* Writing prompts */}
            <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm">
                <p className="text-muted-foreground italic">
                    💡 Tip: Be specific. Instead of "I want to help people," try "I want to help first-generation college students navigate their career choices."
                </p>
            </div>
        </div>
    )
}
