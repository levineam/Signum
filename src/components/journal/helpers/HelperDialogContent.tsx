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
// TODO: Import other *Content components as they're refactored

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
      return (
        <GratitudeContent
          entryId={entryId}
          userId={userId}
          onInsert={handleInsert}
        />
      )

    // TODO: Add cases for other helpers as they're refactored
    // case 'cbt-distortions':
    //   return <CbtDistortionsContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'values-affirmation':
    //   return <ValuesAffirmationContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'self-compassion':
    //   return <SelfCompassionContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'woop':
    //   return <WoopContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'best-possible-self':
    //   return <BestPossibleSelfContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'savoring':
    //   return <SavoringContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'pmr':
    //   return <PMRContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    // case 'loving-kindness':
    //   return <LovingKindnessContent entryId={entryId} userId={userId} onInsert={handleInsert} />

    default:
      return (
        <div className="p-6">
          <p className="text-yellow-600 dark:text-yellow-400 mb-2">
            <strong>Helper not yet refactored</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The &quot;{tileData.fullTitle}&quot; helper content component hasn&apos;t been
            extracted yet. It will continue to work in the old sheet/dialog format
            until refactored.
          </p>
        </div>
      )
  }
}
