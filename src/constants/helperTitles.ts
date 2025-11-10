/**
 * Helper Tile Metadata
 * Story 2.8: Compact tile-based helper UI
 *
 * Defines display metadata for all journal helpers including:
 * - Short titles for tile display
 * - Descriptions (8-12 words) for recognition
 * - Full titles for sheet/dialog headers
 * - Icons for visual differentiation (non-color cue)
 */

import { HelperType } from '@/types/helper'

export interface HelperTileData {
  shortTitle: string // For tile display
  description: string // 8-12 words, shown on tile
  fullTitle: string // For sheet/dialog header
  icon: string // Emoji for visual identity
}

export const HELPER_TILES: Record<HelperType, HelperTileData> = {
  'cbt-distortions': {
    shortTitle: 'Bad Thinking',
    description: 'Identify unhelpful thought patterns',
    fullTitle: 'Cognitive Distortions',
    icon: '🧠',
  },
  gratitude: {
    shortTitle: 'Gratitude',
    description: 'Reflect on what went well today',
    fullTitle: 'Gratitude Practice',
    icon: '✨',
  },
  'values-affirmation': {
    shortTitle: 'Values Affirmation',
    description: 'Clarify what matters most to you',
    fullTitle: 'Values Affirmation',
    icon: '🎯',
  },
  'self-compassion': {
    shortTitle: 'Self-Compassion',
    description: 'Give yourself kindness when struggling',
    fullTitle: 'Self-Compassion Break',
    icon: '💚',
  },
  woop: {
    shortTitle: 'Goal Planning',
    description: 'Plan goals with evidence-based strategy',
    fullTitle: 'WOOP Goal Planning',
    icon: '🚀',
  },
  'best-possible-self': {
    shortTitle: 'Best Self',
    description: 'Envision your ideal future',
    fullTitle: 'Best Possible Self Exercise',
    icon: '🌟',
  },
  savoring: {
    shortTitle: 'Savoring',
    description: 'Amplify positive experiences',
    fullTitle: 'Savoring Practice',
    icon: '🌸',
  },
  'loving-kindness': {
    shortTitle: 'Loving Kindness',
    description: 'Cultivate compassion for yourself and others',
    fullTitle: 'Loving-Kindness Meditation',
    icon: '💝',
  },
  morning: {
    shortTitle: 'Morning Practice',
    description: 'Start your day with intention and reflection',
    fullTitle: 'Morning Daily Practice',
    icon: '☀️',
  },
  'day-planning': {
    shortTitle: 'Plan Your Day',
    description: 'Clarify priorities and commit to action',
    fullTitle: 'Day Planning Helper',
    icon: '📅',
  },
}
