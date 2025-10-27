'use client'

/**
 * HelperTileGrid Component
 * Issue #92: Tile-based Helpers UI
 *
 * Meta-container for all helpers displayed as compact tiles in a grid.
 * Clicking a tile opens a modal with the full helper content.
 *
 * Features:
 * - Header text: "Need help journaling? Check out our helpers."
 * - Responsive grid: 3 cols (desktop), 2 cols (tablet), 1 col (mobile)
 * - Compact tiles with shortened titles
 * - Modal popup for full helper interaction
 */

import { Card } from '@/components/ui/card'
import { HELPER_REGISTRY, HelperDefinition } from '@/data/helpers'
import { HelperType } from '@/types/helper'

interface HelperTileGridProps {
  onTileClick: (helperId: HelperType) => void
  className?: string
}

const THEME_COLORS = {
  default: {
    tile: 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 hover:from-gray-100 hover:to-slate-200 dark:from-gray-950/50 dark:to-slate-950/50 dark:border-gray-800 dark:hover:from-gray-900/70 dark:hover:to-slate-900/70',
    text: 'text-gray-900 dark:text-gray-100',
  },
  blue: {
    tile: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:from-blue-100 hover:to-indigo-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800 dark:hover:from-blue-900/70 dark:hover:to-indigo-900/70',
    text: 'text-blue-900 dark:text-blue-100',
  },
  green: {
    tile: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:from-green-100 hover:to-emerald-200 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800 dark:hover:from-green-900/70 dark:hover:to-emerald-900/70',
    text: 'text-green-900 dark:text-green-100',
  },
  purple: {
    tile: 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:from-purple-100 hover:to-violet-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800 dark:hover:from-purple-900/70 dark:hover:to-violet-900/70',
    text: 'text-purple-900 dark:text-purple-100',
  },
}

function HelperTile({ helper, onClick }: { helper: HelperDefinition; onClick: () => void }) {
  const theme = THEME_COLORS[helper.variant]

  return (
    <Card
      onClick={onClick}
      className={`${theme.tile} cursor-pointer transition-all duration-200 hover:shadow-md p-4 border-2`}
      data-testid={`helper-tile-${helper.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Open ${helper.fullTitle}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <h3 className={`font-semibold text-lg ${theme.text}`}>
          {helper.shortTitle}
        </h3>
        <p className={`text-sm ${theme.text} opacity-80`}>
          {helper.description}
        </p>
      </div>
    </Card>
  )
}

export function HelperTileGrid({ onTileClick, className = '' }: HelperTileGridProps) {
  return (
    <div className={`mb-6 ${className}`} data-testid="helper-tile-grid">
      {/* Header */}
      <div className="mb-4">
        <p className="text-base text-muted-foreground">
          Need help journaling? Check out our <span className="font-medium">helpers</span>.
        </p>
      </div>

      {/* Tile Grid - 3 cols desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {HELPER_REGISTRY.map((helper) => (
          <HelperTile
            key={helper.id}
            helper={helper}
            onClick={() => onTileClick(helper.id)}
          />
        ))}
      </div>
    </div>
  )
}
