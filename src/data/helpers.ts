/**
 * Helper Registry
 * Issue #92: Tile-based Helpers UI
 *
 * Central registry for all journal helpers with metadata for tile display
 */

import { ReactNode } from 'react'
import { HelperType } from '@/types/helper'

export interface HelperDefinition {
  id: HelperType
  shortTitle: string // Compact title for tile display
  fullTitle: string // Original full title
  description: string
  variant: 'default' | 'blue' | 'green' | 'purple'
  icon?: ReactNode // Optional icon for tile
}

export const HELPER_REGISTRY: HelperDefinition[] = [
  {
    id: 'cbt-distortions',
    shortTitle: 'Distorted thoughts',
    fullTitle: 'Have you experienced any distorted thinking today?',
    description: 'Identify and reflect on cognitive distortions',
    variant: 'blue'
  },
  {
    id: '3-good-things',
    shortTitle: '3 Good Things',
    fullTitle: 'What went well today?',
    description: 'Practice gratitude by noting positive moments',
    variant: 'green'
  },
  {
    id: 'values',
    shortTitle: 'Values',
    fullTitle: 'What matters most to you?',
    description: 'Reflect on your core values and priorities',
    variant: 'purple'
  }
]

export function getHelperById(id: HelperType): HelperDefinition | undefined {
  return HELPER_REGISTRY.find(h => h.id === id)
}
