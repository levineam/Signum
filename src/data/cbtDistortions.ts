/**
 * CBT Cognitive Distortions Data
 *
 * Source: Issue #17, Comment 3 (Codex Integration)
 * Based on standard cognitive behavioral therapy (CBT) framework
 *
 * @see https://github.com/levineam/Signum/issues/17#issuecomment-3403523034
 */

export interface CbtDistortion {
  id: string
  name: string
  description: string
  example: string
}

export const CBT_DISTORTIONS: CbtDistortion[] = [
  {
    id: 'all-or-nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Viewing things in black-and-white categories. If a situation falls short of perfect, you see it as a total failure.',
    example: 'If I\'m not perfect, I\'m a total failure.'
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Seeing a single negative event as a never-ending pattern of defeat or negativity.',
    example: 'I didn\'t get that job. I\'ll never find work.'
  },
  {
    id: 'mental-filter',
    name: 'Mental Filter',
    description: 'Picking out a single negative detail and dwelling on it exclusively, so your vision of reality becomes darkened.',
    example: 'I got one piece of negative feedback, so the whole presentation was terrible.'
  },
  {
    id: 'discounting-positive',
    name: 'Discounting the Positive',
    description: 'Rejecting positive experiences by insisting they "don\'t count" for some reason or another.',
    example: 'People only complimented me because they were being nice, not because I did well.'
  },
  {
    id: 'jumping-to-conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without evidence. This includes mind reading (assuming others\' thoughts) and fortune telling (predicting negative outcomes).',
    example: 'They didn\'t reply to my text. They must be angry with me.'
  },
  {
    id: 'magnification-minimization',
    name: 'Magnification/Minimization',
    description: 'Exaggerating the importance of negative things (catastrophizing) or inappropriately shrinking positive things until they seem tiny.',
    example: 'I made a small mistake. This is a disaster and everyone will think I\'m incompetent.'
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional Reasoning',
    description: 'Assuming that negative emotions reflect reality. "I feel it, therefore it must be true."',
    example: 'I feel anxious about this meeting, so something bad must be going to happen.'
  },
  {
    id: 'should-statements',
    name: 'Should Statements',
    description: 'Trying to motivate yourself with "shoulds" and "shouldn\'ts," as if you need to be whipped and punished before you can do anything.',
    example: 'I should have done better. I must always be productive.'
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'An extreme form of overgeneralization. Instead of describing an error, you attach a negative label to yourself or others.',
    example: 'I made a mistake, so I\'m a loser.'
  },
  {
    id: 'personalization-blame',
    name: 'Personalization/Blame',
    description: 'Seeing yourself as the cause of negative events for which you\'re not primarily responsible, or blaming others and overlooking your own role.',
    example: 'My friend is upset. It must be something I did wrong.'
  }
]

/**
 * Helper function to format distortion reflection text
 * Returns plain paragraph format for journal insertion
 */
export function formatDistortionReflection(distortion: CbtDistortion): string {
  return `<p><br></p><p>Today I experienced ${distortion.name}. Here's what happened: </p><p><br></p>`
}

/**
 * Helper function to format multiple distortion reflections
 * Returns concatenated plain paragraphs
 */
export function formatMultipleReflections(distortions: CbtDistortion[]): string {
  return distortions.map(formatDistortionReflection).join('')
}
