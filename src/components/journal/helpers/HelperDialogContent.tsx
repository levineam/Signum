/**
 * HelperDialogContent Component
 * Story 2.9: Routes to appropriate helper content based on type
 *
 * This component serves as a router/switch to render the correct
 * helper *Content component without the HelperContainer wrapper.
 * Used when clicking a helper tile (use mode), not info mode.
 */

import { HelperType } from '@/types/helper'
import { HELPER_TILES } from '@/constants/helperTitles'
// Story 2.9: Import *Content components (without HelperContainer wrappers)
import { GratitudeContent } from './GratitudeHelper'
import { CbtDistortionsContent } from './CbtDistortions'
import { ValuesAffirmationContent } from './ValuesAffirmationHelper'
import { SelfCompassionContent } from './SelfCompassionHelper'
import { WoopContent } from './WoopHelper'
import { BestPossibleSelfContent } from './BestPossibleSelfHelper'
import { SavoringContent } from './SavoringHelper'
import { LovingKindnessContent } from './LovingKindnessHelper'
import { DayPlanningContent } from './DayPlanningHelper'

interface HelperDialogContentProps {
  helperType: HelperType
  entryId: string
  userId: string
  onInsert: (text: string) => void
  onClose: () => void
}

export function HelperDialogContent({
  helperType,
  entryId,
  userId,
  onInsert,
  onClose,
}: HelperDialogContentProps) {
  const tileData = HELPER_TILES[helperType]

  if (!tileData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Helper not found.</p>
      </div>
    )
  }

  // Wrap onInsert to also close the dialog after insertion
  const handleInsert = (text: string) => {
    onInsert(text)
    onClose()
  }

  // Route to appropriate helper content component
  // Story 2.9: All helpers now use *Content components (no HelperContainer)
  switch (helperType) {
    case 'gratitude':
      return (
        <GratitudeContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'cbt-distortions':
      return (
        <CbtDistortionsContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'values-affirmation':
      return (
        <ValuesAffirmationContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'self-compassion':
      return (
        <SelfCompassionContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'woop':
      return (
        <WoopContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'best-possible-self':
      return (
        <BestPossibleSelfContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'savoring':
      return (
        <SavoringContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'loving-kindness':
      return (
        <LovingKindnessContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'day-planning':
      return (
        <DayPlanningContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    default:
      // Fallback - should never reach here if all HelperTypes are handled
      return (
        <div className="p-6">
          <p className="text-gray-500">Helper not found.</p>
        </div>
      )
  }
}
