import type { SelectionItem } from '@/types/exercise'

export const peopleExerciseItems: ReadonlyArray<SelectionItem> = Object.freeze([
  {
    id: 'partner',
    name: 'Partner / Spouse',
    category: 'Immediate Circle',
    description: 'Your life partner.',
    clarifyingQuestion: 'What do you want to give to this relationship?'
  },
  {
    id: 'children',
    name: 'Children',
    category: 'Immediate Circle',
    description: 'Your kids or kids you care for.',
    clarifyingQuestion: 'What do you want your children to feel from you?'
  },
  {
    id: 'parents',
    name: 'Parents',
    category: 'Immediate Circle',
    description: 'Those who raised you.',
    clarifyingQuestion: 'How do you want to show up for your parents?'
  },
  {
    id: 'siblings',
    name: 'Siblings',
    category: 'Immediate Circle',
    description: 'Brothers and sisters.',
    clarifyingQuestion: 'What kind of sibling do you want to be?'
  },
  {
    id: 'close-friends',
    name: 'Close Friends',
    category: 'Inner Circle',
    description: 'Your chosen family.',
    clarifyingQuestion: 'What do your closest friends need from you?'
  },
  {
    id: 'extended-family',
    name: 'Extended Family',
    category: 'Inner Circle',
    description: 'Grandparents, aunts, uncles, cousins.',
    clarifyingQuestion: 'What role do you play in your extended family?'
  },
  {
    id: 'mentors',
    name: 'Mentors',
    category: 'Inner Circle',
    description: 'Those who guide and teach you.',
    clarifyingQuestion: 'How do you honor what your mentors have given you?'
  },
  {
    id: 'mentees',
    name: 'Mentees / Students',
    category: 'Inner Circle',
    description: 'Those you guide and teach.',
    clarifyingQuestion: 'What do you want to pass on to others?'
  },
  {
    id: 'colleagues',
    name: 'Colleagues',
    category: 'Professional',
    description: 'People you work with.',
    clarifyingQuestion: 'How do you want to be experienced at work?'
  },
  {
    id: 'team',
    name: 'Your Team',
    category: 'Professional',
    description: 'People who depend on your leadership.',
    clarifyingQuestion: 'What kind of leader do you want to be?'
  },
  {
    id: 'clients-customers',
    name: 'Clients / Customers',
    category: 'Professional',
    description: 'People you serve professionally.',
    clarifyingQuestion: 'What impact do you want on those you serve?'
  },
  {
    id: 'local-community',
    name: 'Local Community',
    category: 'Community',
    description: 'Your neighbors and neighborhood.',
    clarifyingQuestion: 'How do you want to contribute locally?'
  },
  {
    id: 'faith-community',
    name: 'Faith / Spiritual Community',
    category: 'Community',
    description: 'Those who share your spiritual path.',
    clarifyingQuestion: 'What do you bring to your spiritual community?'
  },
  {
    id: 'interest-community',
    name: 'Interest-Based Community',
    category: 'Community',
    description: 'Groups united by shared passion.',
    clarifyingQuestion: 'Which community of interest matters most?'
  },
  {
    id: 'future-generations',
    name: 'Future Generations',
    category: 'Legacy',
    description: 'Those who will come after.',
    clarifyingQuestion: 'What world do you want to leave behind?'
  },
  {
    id: 'yourself',
    name: 'Yourself',
    category: 'Self',
    description: 'The person in the mirror.',
    clarifyingQuestion: 'How do you want to show up for yourself?'
  }
])
