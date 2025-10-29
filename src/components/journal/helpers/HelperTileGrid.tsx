'use client'

/**
 * HelperTileGrid Component
 * Story 2.8: Tile-based helper UI
 *
 * Displays helpers as compact button tiles in responsive grid.
 * Each tile is a <button> element with proper ARIA attributes.
 * Clicking tile opens sheet/dialog with full helper content.
 */

import { HelperType } from '@/types/helper'
import { HELPER_TILES } from '@/constants/helperTitles'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

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

export function HelperTileGrid({
  helperTypes,
  onTileClick,
  onInfoClick,
  onTileFocus,
  className,
}: HelperTileGridProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Semantic header */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Need help journaling? Check out our helpers.
      </h2>

      {/* Grid: 3 cols (lg+), 2 cols (sm), 1 col (mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {helperTypes.map((helperType) => {
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
    </div>
  )
}
