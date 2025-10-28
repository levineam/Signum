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
import { GratitudeContent } from './GratitudeHelper'
// Import other helpers (with HelperContainer wrappers) - TODO: Extract *Content components
import { CbtDistortions } from './CbtDistortions'
import { ValuesAffirmationHelper } from './ValuesAffirmationHelper'
import { SelfCompassionHelper } from './SelfCompassionHelper'
import { WoopHelper } from './WoopHelper'
import { BestPossibleSelfHelper } from './BestPossibleSelfHelper'
import { SavoringHelper } from './SavoringHelper'
import { ProgressiveMuscleRelaxationHelper } from './ProgressiveMuscleRelaxationHelper'
import { LovingKindnessHelper } from './LovingKindnessHelper'

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
  switch (helperType) {
    case 'gratitude':
      // Story 2.9 Phase 3: Gratitude extracted as *Content component (no HelperContainer)
      return (
        <GratitudeContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    // Story 2.9: Other helpers still use HelperContainer wrappers (TODO: extract *Content)
    case 'cbt-distortions':
      return (
        <CbtDistortions
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'values-affirmation':
      return (
        <ValuesAffirmationHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'self-compassion':
      return (
        <SelfCompassionHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'woop':
      return (
        <WoopHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'best-possible-self':
      return (
        <BestPossibleSelfHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'savoring':
      return (
        <SavoringHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'pmr':
      return (
        <ProgressiveMuscleRelaxationHelper
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    case 'loving-kindness':
      return (
        <LovingKindnessHelper
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
