/**
 * Values Exercise Content
 * Story: Micro-Exercises for Ontology Population
 * 
 * Curated list of ~25 values organized by category.
 * Based on common values frameworks.
 */

import { ExerciseDefinition, ExerciseOption } from '../types'

// =============================================================================
// Values Options
// =============================================================================

export const VALUES_OPTIONS: ExerciseOption[] = [
    // Wisdom & Growth
    {
        id: 'curiosity',
        name: 'Curiosity',
        category: 'Wisdom & Growth',
        description: 'A desire to learn and understand',
        clarifyingQuestion: 'What topics or questions endlessly fascinate you?'
    },
    {
        id: 'growth',
        name: 'Growth',
        category: 'Wisdom & Growth',
        description: 'Continuous improvement and learning',
        clarifyingQuestion: 'How do you approach becoming better at things that matter?'
    },
    {
        id: 'wisdom',
        name: 'Wisdom',
        category: 'Wisdom & Growth',
        description: 'Deep understanding and good judgment',
        clarifyingQuestion: 'What life lessons have shaped your perspective?'
    },
    {
        id: 'creativity',
        name: 'Creativity',
        category: 'Wisdom & Growth',
        description: 'Original thinking and expression',
        clarifyingQuestion: 'How does creative expression show up in your life?'
    },
    {
        id: 'open-mindedness',
        name: 'Open-Mindedness',
        category: 'Wisdom & Growth',
        description: 'Willingness to consider new ideas',
        clarifyingQuestion: 'When did changing your mind lead to something better?'
    },

    // Courage & Strength
    {
        id: 'authenticity',
        name: 'Authenticity',
        category: 'Courage & Strength',
        description: 'Being true to yourself',
        clarifyingQuestion: 'When do you feel most like yourself?'
    },
    {
        id: 'courage',
        name: 'Courage',
        category: 'Courage & Strength',
        description: 'Doing what\'s right despite fear',
        clarifyingQuestion: 'What fear have you faced that taught you something?'
    },
    {
        id: 'perseverance',
        name: 'Perseverance',
        category: 'Courage & Strength',
        description: 'Persistence through challenges',
        clarifyingQuestion: 'What difficulty shaped who you are today?'
    },
    {
        id: 'integrity',
        name: 'Integrity',
        category: 'Courage & Strength',
        description: 'Alignment between values and actions',
        clarifyingQuestion: 'What principle would you never compromise?'
    },
    {
        id: 'independence',
        name: 'Independence',
        category: 'Courage & Strength',
        description: 'Self-reliance and autonomy',
        clarifyingQuestion: 'Where in life do you value making your own path?'
    },

    // Connection & Love
    {
        id: 'compassion',
        name: 'Compassion',
        category: 'Connection & Love',
        description: 'Caring for others\' wellbeing',
        clarifyingQuestion: 'Whose struggles move you most deeply?'
    },
    {
        id: 'love',
        name: 'Love',
        category: 'Connection & Love',
        description: 'Deep affection and care',
        clarifyingQuestion: 'How do you show love to those closest to you?'
    },
    {
        id: 'kindness',
        name: 'Kindness',
        category: 'Connection & Love',
        description: 'Generosity and helping others',
        clarifyingQuestion: 'What small act of kindness stayed with you?'
    },
    {
        id: 'belonging',
        name: 'Belonging',
        category: 'Connection & Love',
        description: 'Being part of something larger',
        clarifyingQuestion: 'Where do you feel most at home?'
    },
    {
        id: 'gratitude',
        name: 'Gratitude',
        category: 'Connection & Love',
        description: 'Appreciation for what you have',
        clarifyingQuestion: 'What are you thankful for that you often overlook?'
    },

    // Justice & Fairness
    {
        id: 'justice',
        name: 'Justice',
        category: 'Justice & Fairness',
        description: 'Fairness and equal treatment',
        clarifyingQuestion: 'What injustice bothers you most?'
    },
    {
        id: 'responsibility',
        name: 'Responsibility',
        category: 'Justice & Fairness',
        description: 'Owning your actions and duties',
        clarifyingQuestion: 'What do you feel responsible for beyond yourself?'
    },
    {
        id: 'leadership',
        name: 'Leadership',
        category: 'Justice & Fairness',
        description: 'Guiding and inspiring others',
        clarifyingQuestion: 'How do you help others move forward?'
    },
    {
        id: 'service',
        name: 'Service',
        category: 'Justice & Fairness',
        description: 'Contributing to something beyond yourself',
        clarifyingQuestion: 'What cause or community do you serve?'
    },
    {
        id: 'fairness',
        name: 'Fairness',
        category: 'Justice & Fairness',
        description: 'Treating everyone equitably',
        clarifyingQuestion: 'How do you handle situations where fairness is unclear?'
    },

    // Meaning & Purpose
    {
        id: 'purpose',
        name: 'Purpose',
        category: 'Meaning & Purpose',
        description: 'A sense of direction and meaning',
        clarifyingQuestion: 'What gives your life a sense of direction?'
    },
    {
        id: 'legacy',
        name: 'Legacy',
        category: 'Meaning & Purpose',
        description: 'Impact that outlasts you',
        clarifyingQuestion: 'What do you want to be remembered for?'
    },
    {
        id: 'hope',
        name: 'Hope',
        category: 'Meaning & Purpose',
        description: 'Optimism about the future',
        clarifyingQuestion: 'What keeps you hopeful during difficult times?'
    },
    {
        id: 'beauty',
        name: 'Beauty',
        category: 'Meaning & Purpose',
        description: 'Appreciation of aesthetics and wonder',
        clarifyingQuestion: 'Where do you find beauty in your everyday life?'
    },
    {
        id: 'spirituality',
        name: 'Spirituality',
        category: 'Meaning & Purpose',
        description: 'Connection to something transcendent',
        clarifyingQuestion: 'What gives your life deeper meaning?'
    }
]

// =============================================================================
// Exercise Definition
// =============================================================================

export const VALUES_EXERCISE: ExerciseDefinition = {
    id: 'values',
    title: 'Discover Your Values',
    subtitle: 'What principles guide your life?',
    targetOntologySection: 'ontology-value',
    estimatedDuration: '60 seconds',
    steps: [
        {
            id: 'select-values',
            title: 'What matters most to you?',
            description: 'Select 5-8 values that deeply resonate with who you are and want to be.',
            inputType: 'multi-select',
            options: VALUES_OPTIONS,
            minSelections: 5,
            maxSelections: 8
        },
        {
            id: 'narrow-values',
            title: 'Now, narrow your focus',
            description: 'From your selections, choose your TOP 5 — the values you\'d fight to protect.',
            inputType: 'ranking',
            usesPreviousSelections: true,
            minSelections: 5,
            maxSelections: 5
        }
    ],
    completionMessage: 'Beautiful. These values will guide your writing journey.'
}
