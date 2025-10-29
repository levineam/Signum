/**
 * HelperInfoDialog Component
 * Story 2.9: Display helper research information in a dialog
 *
 * Shows research evidence, effect sizes, and citations when user clicks
 * the info icon (ℹ️) on a helper tile.
 */

import { HelperType } from '@/types/helper'
import { HELPER_TILES } from '@/constants/helperTitles'
import { HELPER_INFO } from '@/constants/helperInfo'
import { ExternalLink } from 'lucide-react'

interface HelperInfoDialogProps {
  helperType: HelperType
}

export function HelperInfoDialog({ helperType }: HelperInfoDialogProps) {
  const tileData = HELPER_TILES[helperType]
  const infoData = HELPER_INFO[helperType]

  if (!tileData || !infoData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Helper information not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={`${tileData.shortTitle} icon`}>
            {tileData.icon}
          </span>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {infoData.title}
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tileData.description}
        </p>
      </div>

      {/* Research Evidence Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Research Evidence
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {infoData.description}
        </p>
      </div>

      {/* Effect Size */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wide">
            Effect Size:
          </span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {infoData.effectSize}
          </span>
        </div>
      </div>

      {/* Citation */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Citation
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
          {infoData.citation}
        </p>
      </div>

      {/* Learn More Link (if available) */}
      {infoData.learnMoreUrl && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <a
            href={infoData.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
          >
            <span>Learn more</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  )
}
