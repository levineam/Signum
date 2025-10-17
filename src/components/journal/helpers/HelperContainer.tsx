'use client'

/**
 * HelperContainer Component
 * Issue #18: Unified Helper Framework
 *
 * A unified container/wrapper component for all journal helpers.
 * Provides consistent:
 * - Visual structure and styling
 * - Progressive disclosure pattern (expand/collapse)
 * - Accessibility features (aria-live, keyboard navigation)
 * - Dismissal functionality (persistent via Supabase)
 *
 * Designed to wrap helper content (e.g., CBT Distortions, Reflection Prompts).
 */

import { useState, useRef, ReactNode, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { HelperType } from '@/types/helper'

export interface HelperContainerProps {
  /** Unique identifier for the helper type */
  helperType: HelperType

  /** Header text displayed when helper is collapsed */
  headerText: string

  /** Optional description text shown when expanded */
  descriptionText?: string

  /** Content to display when helper is expanded */
  children: ReactNode

  /** Callback when user dismisses the helper */
  onDismiss?: () => void

  /** Callback when helper is expanded/collapsed */
  onExpandChange?: (isExpanded: boolean) => void

  /** Ref callback to expose collapse function to parent */
  collapseRef?: React.MutableRefObject<(() => void) | null>

  /** Visual theme variant */
  variant?: 'default' | 'blue' | 'green' | 'purple'

  /** Optional CSS class name for customization */
  className?: string

  /** Test ID for Playwright tests */
  testId?: string

  /** Whether to show the dismiss button */
  showDismiss?: boolean

  /** Whether to start in expanded state */
  defaultExpanded?: boolean
}

/** Theme color mappings for different helper types */
const THEME_COLORS = {
  default: {
    card: 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/30 dark:to-slate-950/30 dark:border-gray-800',
    text: 'text-gray-900 dark:text-gray-100',
    subtext: 'text-gray-800 dark:text-gray-200',
    button: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-900/50',
  },
  blue: {
    card: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    subtext: 'text-blue-800 dark:text-blue-200',
    button: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/50',
  },
  green: {
    card: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    subtext: 'text-green-800 dark:text-green-200',
    button: 'text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/50',
  },
  purple: {
    card: 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/30 dark:to-violet-950/30 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    subtext: 'text-purple-800 dark:text-purple-200',
    button: 'text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/50',
  },
}

export function HelperContainer({
  helperType,
  headerText,
  descriptionText,
  children,
  onDismiss,
  onExpandChange,
  collapseRef,
  variant = 'default',
  className = '',
  testId,
  showDismiss = true,
  defaultExpanded = false,
}: HelperContainerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const exploreButtonRef = useRef<HTMLButtonElement>(null)

  const theme = THEME_COLORS[variant]

  // Expose collapse function to parent via ref
  useEffect(() => {
    if (collapseRef) {
      collapseRef.current = () => {
        setIsExpanded(false)
        announce(`${helperType} helper collapsed`)
        // Return focus to Explore button
        setTimeout(() => {
          exploreButtonRef.current?.focus()
        }, 100)
      }
    }
    return () => {
      if (collapseRef) {
        collapseRef.current = null
      }
    }
  }, [collapseRef, helperType])

  // Helper function to announce to screen readers
  const announce = (message: string) => {
    setLiveRegionMessage(message)
    // Clear after announcement
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  // Handle expand/collapse
  const handleExpand = () => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)

    if (newExpandedState) {
      announce(`${helperType} helper expanded`)
    } else {
      announce(`${helperType} helper collapsed`)
      // Return focus to Explore button
      setTimeout(() => {
        exploreButtonRef.current?.focus()
      }, 100)
    }

    onExpandChange?.(newExpandedState)
  }

  // Handle dismiss
  const handleDismiss = () => {
    announce(`${helperType} helper dismissed`)
    onDismiss?.()
  }

  // Keyboard handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Escape closes the expanded panel
    if (event.key === 'Escape' && isExpanded) {
      event.preventDefault()
      setIsExpanded(false)
      announce(`${helperType} helper collapsed`)
      exploreButtonRef.current?.focus()
    }
  }

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>

      <Card
        className={`mb-4 ${theme.card}`}
        data-testid={testId}
      >
        <div className="px-4 py-1">
          {/* Header with Explore and Dismiss buttons */}
          <div className="flex items-center justify-between">
            <span className={`font-medium text-lg ${theme.text}`}>
              {headerText}
            </span>

            <div className="flex items-center gap-2">
              <Button
                ref={exploreButtonRef}
                onClick={handleExpand}
                variant="ghost"
                size="sm"
                className={theme.button}
                aria-expanded={isExpanded}
                aria-controls={`${helperType}-panel`}
                data-testid={testId ? `${testId}-explore-button` : undefined}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Explore
                  </>
                )}
              </Button>

              {showDismiss && (
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className={theme.button}
                  aria-label={`Dismiss ${helperType} helper`}
                  data-testid={testId ? `${testId}-dismiss-button` : undefined}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Expanded panel with helper content */}
          {isExpanded && (
            <div
              id={`${helperType}-panel`}
              data-testid={testId ? `${testId}-helper-panel` : undefined}
              className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {descriptionText && (
                <p className={`text-base ${theme.subtext} mb-4`}>
                  {descriptionText}
                </p>
              )}

              {children}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
