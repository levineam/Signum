'use client'

/**
 * Reflection Prompt Helper Component
 * Issue #18: Unified Helper Framework
 *
 * Refactored from "Gentle Prompt" inline implementation to use
 * the unified HelperContainer component.
 *
 * Features:
 * - ACT-inspired reflection prompts with rotation
 * - Persistent dismissal via Supabase user_preferences
 * - Refresh functionality for new prompts
 * - Full accessibility compliance
 */

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { HelperContainer } from './HelperContainer'
import { getNextPrompt } from '@/utils/reflectionPrompts'
import { dismissHelper, isHelperDismissed, createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface ReflectionPromptHelperProps {
  userId: string
  entryId: string
}

export function ReflectionPromptHelper({ userId, entryId }: ReflectionPromptHelperProps) {
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Track events for usage logging
  const eventsRef = useRef<HelperEvent[]>([])

  // Helper function to add event to tracking
  const addEvent = (event: HelperEvent) => {
    eventsRef.current.push(event)
  }

  // Load prompt and check dismissal state on mount
  useEffect(() => {
    async function initializePrompt() {
      setIsLoading(true)

      // Get initial prompt
      const prompt = getNextPrompt()
      setCurrentPrompt(prompt)

      // Check if user has dismissed this helper
      const dismissed = await isHelperDismissed(userId, 'reflection-prompt')
      setIsDismissed(dismissed)

      setIsLoading(false)

      // Track helper opened event
      addEvent({
        type: 'helper_opened',
        timestamp: new Date().toISOString(),
        data: { triggerSource: 'auto' }
      })
    }

    initializePrompt()
  }, [userId])

  // Handle prompt refresh
  const handlePromptRefresh = () => {
    const newPrompt = getNextPrompt()
    setCurrentPrompt(newPrompt)

    // Track refresh as a selection event
    addEvent({
      type: 'helper_selection',
      timestamp: new Date().toISOString(),
      data: {
        selectedCount: 1,
        selectedItems: ['prompt-refreshed']
      }
    })
  }

  // Handle dismissal (persistent to Supabase)
  const handleDismiss = async () => {
    setIsDismissed(true)

    // Track dismissal event
    addEvent({
      type: 'helper_dismissed',
      timestamp: new Date().toISOString(),
      data: { dismissalReason: 'manual' }
    })

    // Log usage to database with dismissal event
    try {
      await createHelperUsage({
        helperType: 'reflection-prompt',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          promptCategory: categorizePrompt(currentPrompt)
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper dismissal:', error)
    }

    // Persist dismissal to user preferences
    await dismissHelper(userId, 'reflection-prompt')
  }

  // Handle expansion change
  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      // Track helper opened event
      addEvent({
        type: 'helper_opened',
        timestamp: new Date().toISOString(),
        data: { triggerSource: 'manual' }
      })
    }
  }

  // Helper function to categorize prompt for analytics
  function categorizePrompt(prompt: string): string {
    if (prompt.includes('value') || prompt.includes('vitality') || prompt.includes('meaning')) {
      return 'values-focused'
    }
    if (prompt.includes('sensation') || prompt.includes('sound') || prompt.includes('notice')) {
      return 'mindfulness'
    }
    if (prompt.includes('step') || prompt.includes('challenge') || prompt.includes('action')) {
      return 'committed-action'
    }
    if (prompt.includes('story') || prompt.includes('worry') || prompt.includes('thought')) {
      return 'cognitive-defusion'
    }
    return 'general'
  }

  // Don't render if dismissed or still loading
  if (isLoading || isDismissed) {
    return null
  }

  return (
    <HelperContainer
      helperType="reflection-prompt"
      headerText={currentPrompt}
      variant="default"
      onDismiss={handleDismiss}
      onExpandChange={handleExpandChange}
      showDismiss={true}
      defaultExpanded={false}
      testId="reflection-prompt-helper"
    >
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Need a different prompt?
        </p>
        <Button
          onClick={handlePromptRefresh}
          variant="ghost"
          size="sm"
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-900/50"
          aria-label="Get new reflection prompt"
          data-testid="reflection-prompt-refresh-button"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          New Prompt
        </Button>
      </div>
    </HelperContainer>
  )
}
