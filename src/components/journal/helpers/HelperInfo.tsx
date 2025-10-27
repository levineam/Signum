'use client'

/**
 * HelperInfo Component
 *
 * Displays evidence-based information about journaling helpers in a popover.
 * Shows brief description, effect size, and research citation to help users
 * understand the scientific basis of each helper.
 */

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface HelperInfoContent {
  title: string
  description: string
  effectSize?: string
  citation: string
  learnMoreUrl?: string
}

interface HelperInfoProps {
  content: HelperInfoContent
  variant?: 'default' | 'blue' | 'green' | 'purple'
}

/** Theme color mappings for info icon */
const INFO_COLORS = {
  default: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
  blue: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
  green: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
  purple: 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200',
}

export function HelperInfo({ content, variant = 'default' }: HelperInfoProps) {
  const colorClass = INFO_COLORS[variant]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${colorClass}`}
          aria-label={`Learn more about ${content.title}`}
          data-testid="helper-info-button"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        align="end"
        data-testid="helper-info-popover"
      >
        <div className="space-y-3">
          {/* Title */}
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {content.title}
          </h4>

          {/* Description */}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {content.description}
          </p>

          {/* Effect Size (if provided) */}
          {content.effectSize && (
            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Effect Size:</strong> {content.effectSize}
              </p>
            </div>
          )}

          {/* Citation */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Research:</strong> {content.citation}
            </p>
          </div>

          {/* Learn More Link (if provided) */}
          {content.learnMoreUrl && (
            <a
              href={content.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
            >
              Learn more →
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
