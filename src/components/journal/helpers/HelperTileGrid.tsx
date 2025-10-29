'use client'

/**
 * HelperTileGrid Component
 * Story 2.8: Tile-based helper UI
 * Issue #105: Collapsible helpers section
 *
 * Displays helpers as compact button tiles in responsive grid.
 * Each tile is a <button> element with proper ARIA attributes.
 * Clicking tile opens sheet/dialog with full helper content.
 * Collapsible: Shows 3 helpers by default, expandable to all 8.
 */

import { useState, useEffect } from 'react'
import { HelperType } from '@/types/helper'
import { HELPER_TILES } from '@/constants/helperTitles'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Info, ChevronDown } from 'lucide-react'

interface HelperTileGridProps {
  helperTypes: HelperType[]
  onTileClick: (helperType: HelperType) => void
  onInfoClick: (helperType: HelperType) => void // NEW: For info icon clicks
  onTileFocus?: (helperType: HelperType) => void // For prefetch
  className?: string
}

// Theme colors for different helper types
const HELPER_VARIANTS: Record<HelperType, string> = {
  'cbt-distortions': 'from-blue-50 to-indigo-50 border-blue-200 hover:shadow-blue-100 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800',
  gratitude: 'from-green-50 to-emerald-50 border-green-200 hover:shadow-green-100 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800',
  'values-affirmation': 'from-purple-50 to-violet-50 border-purple-200 hover:shadow-purple-100 dark:from-purple-950/30 dark:to-violet-950/30 dark:border-purple-800',
  'self-compassion': 'from-pink-50 to-rose-50 border-pink-200 hover:shadow-pink-100 dark:from-pink-950/30 dark:to-rose-950/30 dark:border-pink-800',
  woop: 'from-orange-50 to-amber-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-800',
  'best-possible-self': 'from-yellow-50 to-lime-50 border-yellow-200 hover:shadow-yellow-100 dark:from-yellow-950/30 dark:to-lime-950/30 dark:border-yellow-800',
  savoring: 'from-pink-50 to-rose-50 border-pink-200 hover:shadow-pink-100 dark:from-pink-950/30 dark:to-rose-950/30 dark:border-pink-800',
  'loving-kindness': 'from-rose-50 to-pink-50 border-rose-200 hover:shadow-rose-100 dark:from-rose-950/30 dark:to-pink-950/30 dark:border-rose-800',
}

// LocalStorage key for persisting collapsed/expanded state
const HELPERS_EXPANDED_KEY = 'signum-helpers-expanded'

export function HelperTileGrid({
  helperTypes,
  onTileClick,
  onInfoClick,
  onTileFocus,
  className,
}: HelperTileGridProps) {
  // Default to collapsed state (false) on initial render
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Load preference from localStorage after mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(HELPERS_EXPANDED_KEY)
    if (stored !== null) {
      setIsExpanded(JSON.parse(stored))
    }
    setHasHydrated(true)
  }, [])

  // Persist state to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem(HELPERS_EXPANDED_KEY, JSON.stringify(isExpanded))
    }
  }, [isExpanded, hasHydrated])

  // Determine which helpers to show based on expanded state
  const visibleHelpers = isExpanded ? helperTypes : helperTypes.slice(0, 3)

  return (
    <div className={cn('mb-6', className)}>
      {/* Semantic header */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Need help journaling? Check out our helpers.
      </h2>

      {/* Grid: 3 cols (lg+), 2 cols (sm), 1 col (mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleHelpers.map((helperType) => {
          const tileData = HELPER_TILES[helperType]
          if (!tileData) return null

          return (
            <div key={helperType} className="relative group">
              <Card
                className={cn(
                  'h-full p-4 bg-gradient-to-r border transition-all duration-200',
                  'group-hover:shadow-lg group-hover:-translate-y-0.5',
                  HELPER_VARIANTS[helperType]
                )}
              >
                {/* Info Icon Button - Top Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onInfoClick(helperType)
                  }}
                  aria-label={`Learn more about ${tileData.fullTitle}`}
                  className={cn(
                    'absolute top-2 right-2 z-10',
                    'p-1.5 rounded-full',
                    'bg-white/80 dark:bg-gray-900/80',
                    'hover:bg-white dark:hover:bg-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'transition-all duration-200',
                    'opacity-70 hover:opacity-100'
                  )}
                >
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Tile Body Button */}
                <button
                  type="button"
                  onClick={() => onTileClick(helperType)}
                  onFocus={() => onTileFocus?.(helperType)}
                  onMouseEnter={() => onTileFocus?.(helperType)}
                  aria-haspopup="dialog"
                  aria-controls={`helper-dialog-${helperType}`}
                  aria-label={`Open ${tileData.fullTitle} helper`}
                  className={cn(
                    'w-full text-left',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent',
                    'rounded-md transition-all duration-200'
                  )}
                >
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-2 pr-8">
                    <span
                      className="text-2xl flex-shrink-0"
                      role="img"
                      aria-label={`${tileData.shortTitle} icon`}
                    >
                      {tileData.icon}
                    </span>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                      {tileData.shortTitle}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {tileData.description}
                  </p>
                </button>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Expand/Collapse Control */}
      {helperTypes.length > 3 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="helper-tile-grid"
          className={cn(
            'mt-4 mx-auto flex items-center gap-2',
            'text-sm text-muted-foreground hover:text-foreground',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'rounded-md px-3 py-2'
          )}
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
          <span>
            {isExpanded
              ? 'Show fewer helpers'
              : 'Show more helpers'}
          </span>
        </button>
      )}
    </div>
  )
}
