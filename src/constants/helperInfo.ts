/**
 * Helper Research Information
 * Story 2.9: Centralized helper metadata for info dialogs
 *
 * Contains research evidence, effect sizes, and citations for all helpers.
 * Previously scattered across individual helper components as `infoContent` props.
 */

import { HelperType } from '@/types/helper'

export interface HelperResearchInfo {
  /** Full title of the helper */
  title: string
  /** Description of the helper's purpose and mechanism */
  description: string
  /** Effect size or research outcome metric */
  effectSize: string
  /** Academic citation for the research */
  citation: string
  /** Optional URL for "Learn More" link */
  learnMoreUrl?: string
}

export const HELPER_INFO: Record<HelperType, HelperResearchInfo> = {
  morning: {
    title: 'Morning Practice',
    description:
      'A comprehensive evidence-based daily practice combining values clarification, implementation intentions, mental contrasting, emotional awareness, cognitive reframing, social connection planning, growth mindset, and future visualization. This integrated approach addresses multiple well-being dimensions.',
    effectSize: 'd=0.65 for implementation intentions (strongest component)',
    citation:
      'Integrates research from Gollwitzer (2006), Oettingen (2014), Kim et al. (2022), and others.',
    learnMoreUrl: 'https://github.com/levineam/Signum/issues/100',
  },

  'cbt-distortions': {
    title: 'CBT Cognitive Distortions',
    description:
      'Cognitive Behavioral Therapy identifies patterns of distorted thinking that contribute to emotional distress. Recognizing and reframing these patterns can reduce anxiety and depression.',
    effectSize: 'd=0.80-1.00 for depression and anxiety',
    citation:
      'Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427-440.',
  },

  gratitude: {
    title: 'Three Good Things',
    description:
      'A gratitude practice where you identify three positive events from your day and reflect on why they happened. Regular practice strengthens well-being and life satisfaction.',
    effectSize: 'd=0.31 for well-being improvements',
    citation:
      'Dickens, L. (2017). Using gratitude to promote positive change. Journal of Positive Psychology.',
    learnMoreUrl: 'https://ggia.berkeley.edu/practice/three-good-things',
  },

  'values-affirmation': {
    title: 'Values Self-Affirmation',
    description:
      'Reflecting on your core values strengthens your sense of self-integrity and acts as a psychological buffer against stress. This practice is foundational to ACT (Acceptance and Commitment Therapy).',
    effectSize: 'd=0.20-0.40 for stress buffering',
    citation:
      'Sherman, D. K., & Cohen, G. L. (2006). The psychology of self-defense: Self-affirmation theory. Advances in Experimental Social Psychology, 38, 183-242.',
  },

  'self-compassion': {
    title: 'Self-Compassion Break',
    description:
      "Kristin Neff's three-step practice for responding to difficult moments with kindness instead of self-criticism. Combines mindfulness, common humanity, and self-kindness to reduce suffering.",
    effectSize: 'd=0.47 for well-being improvements',
    citation:
      'Neff, K. D., & Germer, C. K. (2013). A pilot study and randomized controlled trial of the mindful self-compassion program. Journal of Clinical Psychology, 69(1), 28-44.',
    learnMoreUrl: 'https://self-compassion.org/exercise-2-self-compassion-break/',
  },

  woop: {
    title: 'WOOP Goal Planning',
    description:
      'Mental contrasting combines positive visualization with obstacle planning. This evidence-based method increases goal achievement rates by creating realistic if-then plans that trigger action when obstacles arise.',
    effectSize: 'Significantly outperforms positive thinking alone',
    citation:
      'Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current Directions in Psychological Science.',
    learnMoreUrl: 'https://woopmylife.org/',
  },

  'best-possible-self': {
    title: 'Best Possible Self',
    description:
      'Writing about your ideal future self increases well-being, optimism, and life satisfaction. Focus on a realistic best-case scenario across personal, professional, and relational domains.',
    effectSize: 'd=0.28 for well-being improvements',
    citation:
      'King, L. A. (2001). The health benefits of writing about life goals. Personality and Social Psychology Bulletin, 27(7), 798-807.',
  },

  savoring: {
    title: 'Savoring Practice',
    description:
      'Research-based strategies to amplify positive experiences and extract more joy from good moments.',
    effectSize: 'd = 0.32 (Bryant meta-analysis)',
    citation:
      'Bryant, F. B., & Veroff, J. (2007). Savoring: A new model of positive experience. Psychology Press.',
    learnMoreUrl: 'https://psycnet.apa.org/record/2007-01113-000',
  },

  'loving-kindness': {
    title: 'Loving-Kindness Meditation',
    description:
      'Traditional Buddhist metta practice for cultivating compassion and positive emotions toward self and others.',
    effectSize: 'd = 0.33 for positive emotions (Galante et al., 2014)',
    citation:
      'Galante, J., et al. (2014). Loving-kindness meditation for chronic pain. Journal of Clinical Psychology, 70(9), 794-807.',
    learnMoreUrl: 'https://www.mindful.org/a-guide-to-loving-kindness-meditation/',
  },
}
