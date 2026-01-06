/**
 * Impact Exercise Content
 * Story: Micro-Exercises for Ontology Population
 * 
 * Helps users identify who they want to help and what change 
 * they want to create. Used as input for purpose synthesis.
 */

import { ExerciseDefinition, ExerciseOption } from '../types'

// =============================================================================
// Beneficiary Options
// =============================================================================

export const BENEFICIARY_OPTIONS: ExerciseOption[] = [
    // Individuals
    {
        id: 'children',
        name: 'Children',
        category: 'Individuals',
        description: 'Young people learning about the world',
        clarifyingQuestion: 'What do you wish someone had taught you as a child?'
    },
    {
        id: 'young-adults',
        name: 'Young Adults',
        category: 'Individuals',
        description: 'People finding their path in life',
        clarifyingQuestion: 'What guidance do young adults need most?'
    },
    {
        id: 'parents',
        name: 'Parents',
        category: 'Individuals',
        description: 'People raising the next generation',
        clarifyingQuestion: 'What challenge of parenting resonates with you?'
    },
    {
        id: 'professionals',
        name: 'Professionals',
        category: 'Individuals',
        description: 'People building their careers',
        clarifyingQuestion: 'What would help professionals thrive?'
    },
    {
        id: 'creatives',
        name: 'Creatives',
        category: 'Individuals',
        description: 'Artists, writers, makers',
        clarifyingQuestion: 'What obstacle do creatives face that you understand?'
    },
    {
        id: 'leaders',
        name: 'Leaders',
        category: 'Individuals',
        description: 'People guiding teams and organizations',
        clarifyingQuestion: 'What do leaders need support with?'
    },

    // Communities
    {
        id: 'local-community',
        name: 'Local Community',
        category: 'Communities',
        description: 'Your neighborhood and city',
        clarifyingQuestion: 'What does your community need most?'
    },
    {
        id: 'underserved',
        name: 'Underserved Communities',
        category: 'Communities',
        description: 'Groups lacking access or resources',
        clarifyingQuestion: 'What barrier to access concerns you most?'
    },
    {
        id: 'entrepreneurs',
        name: 'Entrepreneurs',
        category: 'Communities',
        description: 'People building new things',
        clarifyingQuestion: 'What would help founders succeed?'
    },
    {
        id: 'educators',
        name: 'Educators',
        category: 'Communities',
        description: 'Teachers and mentors',
        clarifyingQuestion: 'What do educators struggle with?'
    },

    // Broader Impact
    {
        id: 'future-generations',
        name: 'Future Generations',
        category: 'Broader Impact',
        description: 'People not yet born',
        clarifyingQuestion: 'What world do you want to leave behind?'
    },
    {
        id: 'planet',
        name: 'The Planet',
        category: 'Broader Impact',
        description: 'Environmental and ecological wellbeing',
        clarifyingQuestion: 'What environmental concern motivates you?'
    },
    {
        id: 'humanity',
        name: 'Humanity',
        category: 'Broader Impact',
        description: 'All people, everywhere',
        clarifyingQuestion: 'What would make the world better for everyone?'
    },
    {
        id: 'animals',
        name: 'Animals',
        category: 'Broader Impact',
        description: 'Animal welfare and rights',
        clarifyingQuestion: 'How do you want to help animals?'
    }
]

// =============================================================================
// Exercise Definition
// =============================================================================

export const IMPACT_EXERCISE: ExerciseDefinition = {
    id: 'impact',
    title: 'Define Your Impact',
    subtitle: 'Who do you want to help?',
    targetOntologySection: 'ontology-aim', // Used as input for purpose synthesis
    estimatedDuration: '90 seconds',
    steps: [
        {
            id: 'select-beneficiaries',
            title: 'Who matters most to you?',
            description: 'Select 1-3 groups you feel called to serve or support.',
            inputType: 'multi-select',
            options: BENEFICIARY_OPTIONS,
            minSelections: 1,
            maxSelections: 3
        },
        {
            id: 'describe-change',
            title: 'What change do you want to create?',
            description: 'In a few sentences, describe the positive change you want to bring to these groups.',
            inputType: 'free-text',
            placeholder: 'I want to help [who] by [doing what] so that [what changes]...'
        }
    ],
    completionMessage: 'Your impact vision will shape your goals and purpose.'
}
