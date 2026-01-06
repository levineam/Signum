/**
 * Strengths Exercise Content
 * Story: Micro-Exercises for Ontology Population
 * 
 * Curated list of ~24 strengths organized by category.
 * Used as input for purpose synthesis.
 */

import { ExerciseDefinition, ExerciseOption } from '../types'

// =============================================================================
// Strengths Options
// =============================================================================

export const STRENGTHS_OPTIONS: ExerciseOption[] = [
    // Thinking & Analysis
    {
        id: 'strategic-thinking',
        name: 'Strategic Thinking',
        category: 'Thinking & Analysis',
        description: 'Seeing the big picture and planning ahead',
        clarifyingQuestion: 'When has seeing the bigger picture helped you or others?'
    },
    {
        id: 'problem-solving',
        name: 'Problem Solving',
        category: 'Thinking & Analysis',
        description: 'Finding solutions to complex challenges',
        clarifyingQuestion: 'What kind of problems do people bring to you?'
    },
    {
        id: 'analytical',
        name: 'Analytical Mind',
        category: 'Thinking & Analysis',
        description: 'Breaking down complex ideas',
        clarifyingQuestion: 'How do you make sense of complicated information?'
    },
    {
        id: 'pattern-recognition',
        name: 'Pattern Recognition',
        category: 'Thinking & Analysis',
        description: 'Seeing connections others miss',
        clarifyingQuestion: 'What patterns do you notice that others overlook?'
    },
    {
        id: 'learning',
        name: 'Quick Learning',
        category: 'Thinking & Analysis',
        description: 'Rapidly acquiring new knowledge',
        clarifyingQuestion: 'What have you taught yourself that surprised others?'
    },
    {
        id: 'systems-thinking',
        name: 'Systems Thinking',
        category: 'Thinking & Analysis',
        description: 'Understanding how parts interact as a whole',
        clarifyingQuestion: 'How do you see complex situations as interconnected systems?'
    },

    // Communication & Influence
    {
        id: 'storytelling',
        name: 'Storytelling',
        category: 'Communication & Influence',
        description: 'Crafting compelling narratives',
        clarifyingQuestion: 'What stories do you find yourself telling again and again?'
    },
    {
        id: 'teaching',
        name: 'Teaching',
        category: 'Communication & Influence',
        description: 'Helping others understand and grow',
        clarifyingQuestion: 'What do you love teaching others?'
    },
    {
        id: 'listening',
        name: 'Deep Listening',
        category: 'Communication & Influence',
        description: 'Truly hearing what others mean',
        clarifyingQuestion: 'How does listening help you connect with others?'
    },
    {
        id: 'persuasion',
        name: 'Persuasion',
        category: 'Communication & Influence',
        description: 'Influencing through compelling arguments',
        clarifyingQuestion: 'How do you help others see a new perspective?'
    },
    {
        id: 'writing',
        name: 'Writing',
        category: 'Communication & Influence',
        description: 'Expressing ideas clearly in writing',
        clarifyingQuestion: 'What do you love to write about?'
    },
    {
        id: 'public-speaking',
        name: 'Public Speaking',
        category: 'Communication & Influence',
        description: 'Presenting ideas to groups',
        clarifyingQuestion: 'When do you feel confident speaking to others?'
    },

    // People & Relationships
    {
        id: 'empathy',
        name: 'Empathy',
        category: 'People & Relationships',
        description: 'Understanding others\' emotions',
        clarifyingQuestion: 'How do you know when someone needs support?'
    },
    {
        id: 'connecting',
        name: 'Connecting People',
        category: 'People & Relationships',
        description: 'Building bridges between others',
        clarifyingQuestion: 'Who have you introduced that created something together?'
    },
    {
        id: 'mentoring',
        name: 'Mentoring',
        category: 'People & Relationships',
        description: 'Guiding others\' development',
        clarifyingQuestion: 'Whose growth have you helped shape?'
    },
    {
        id: 'collaboration',
        name: 'Collaboration',
        category: 'People & Relationships',
        description: 'Working effectively with others',
        clarifyingQuestion: 'What makes you a good collaborator?'
    },
    {
        id: 'conflict-resolution',
        name: 'Conflict Resolution',
        category: 'People & Relationships',
        description: 'Finding common ground in disagreements',
        clarifyingQuestion: 'How do you help resolve tensions between people?'
    },
    {
        id: 'relationship-building',
        name: 'Relationship Building',
        category: 'People & Relationships',
        description: 'Creating and maintaining meaningful connections',
        clarifyingQuestion: 'How do you nurture your most important relationships?'
    },

    // Execution & Action
    {
        id: 'organizing',
        name: 'Organizing',
        category: 'Execution & Action',
        description: 'Creating order from chaos',
        clarifyingQuestion: 'What do you organize that others struggle with?'
    },
    {
        id: 'focus',
        name: 'Deep Focus',
        category: 'Execution & Action',
        description: 'Sustained attention on important work',
        clarifyingQuestion: 'What can you concentrate on for hours?'
    },
    {
        id: 'execution',
        name: 'Execution',
        category: 'Execution & Action',
        description: 'Getting things done reliably',
        clarifyingQuestion: 'What project are you proud of completing?'
    },
    {
        id: 'adaptability',
        name: 'Adaptability',
        category: 'Execution & Action',
        description: 'Adjusting quickly to change',
        clarifyingQuestion: 'How do you stay effective when plans change?'
    },
    {
        id: 'initiative',
        name: 'Initiative',
        category: 'Execution & Action',
        description: 'Starting things without being asked',
        clarifyingQuestion: 'What have you started that wasn\'t assigned to you?'
    },
    {
        id: 'persistence',
        name: 'Persistence',
        category: 'Execution & Action',
        description: 'Continuing despite obstacles',
        clarifyingQuestion: 'What challenge did you push through when others gave up?'
    }
]

// =============================================================================
// Exercise Definition
// =============================================================================

export const STRENGTHS_EXERCISE: ExerciseDefinition = {
    id: 'strengths',
    title: 'Discover Your Strengths',
    subtitle: 'What comes naturally to you?',
    targetOntologySection: 'ontology-aim', // Used as input for purpose synthesis
    estimatedDuration: '60 seconds',
    steps: [
        {
            id: 'select-strengths',
            title: 'What are you naturally good at?',
            description: 'Select 4-7 strengths that describe abilities others often recognize in you.',
            inputType: 'multi-select',
            options: STRENGTHS_OPTIONS,
            minSelections: 4,
            maxSelections: 7
        },
        {
            id: 'rank-strengths',
            title: 'Rank your top 3',
            description: 'Which of these strengths are most core to who you are?',
            inputType: 'ranking',
            usesPreviousSelections: true,
            minSelections: 3,
            maxSelections: 3
        }
    ],
    completionMessage: 'These strengths will help shape your purpose.'
}
