/**
 * Seed Execution Stack with Sample Data
 *
 * This script seeds the execution stack with realistic Goals, Projects, and Tasks
 * to demonstrate the UI in real-world usage.
 *
 * Usage: Run this script directly or import and call seedExecutionStack(userId)
 */

import { createClient } from '@supabase/supabase-js'
import { HierarchicalOntologyItem } from '../src/types/note'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SampleTask {
  name: string
  completed: boolean
}

interface SampleProject {
  name: string
  tasks: SampleTask[]
}

interface SampleGoal {
  name: string
  projects: SampleProject[]
}

const sampleGoals: SampleGoal[] = [
  {
    name: 'Build Signum',
    projects: [
      {
        name: 'Frontend Refactor',
        tasks: [
          { name: 'Update SimpleRichEditor component', completed: true },
          { name: 'Add comprehensive tests', completed: false },
          { name: 'Improve accessibility', completed: false }
        ]
      },
      {
        name: 'Backend API',
        tasks: [
          { name: 'Setup API routes', completed: true },
          { name: 'Add authentication middleware', completed: false },
          { name: 'Implement RLS policies', completed: false }
        ]
      },
      {
        name: 'Deploy to Production',
        tasks: [
          { name: 'Configure Vercel settings', completed: true },
          { name: 'Setup environment variables', completed: false },
          { name: 'Run deployment tests', completed: false }
        ]
      }
    ]
  },
  {
    name: 'Live Authentically',
    projects: [
      {
        name: 'Morning Routine',
        tasks: [
          { name: '10 min meditation', completed: true },
          { name: 'Journaling practice', completed: false },
          { name: 'Gratitude reflection', completed: false }
        ]
      },
      {
        name: 'Evening Reflection',
        tasks: [
          { name: 'Review daily progress', completed: false },
          { name: 'Gratitude journaling', completed: false }
        ]
      }
    ]
  },
  {
    name: 'Learn Rust',
    projects: [
      {
        name: 'The Rust Programming Language Book',
        tasks: [
          { name: 'Chapter 1: Getting Started', completed: true },
          { name: 'Chapter 2: Guessing Game', completed: false },
          { name: 'Chapter 3: Common Concepts', completed: false },
          { name: 'Chapter 4: Ownership', completed: false }
        ]
      },
      {
        name: 'Practice Projects',
        tasks: [
          { name: 'CLI tool project', completed: false },
          { name: 'Web server exercise', completed: false }
        ]
      }
    ]
  }
]

/**
 * Seed execution stack with sample data for a given user
 */
export async function seedExecutionStack(userId: string) {
  console.log(`Seeding execution stack for user ${userId}...`)

  // Find or create pinned notes for goals, projects, tasks
  const { data: notes, error: fetchError } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_pinned', true)
    .in('metadata->>ontologyCategory', ['goals', 'projects', 'tasks'])

  if (fetchError) {
    throw new Error(`Failed to fetch pinned notes: ${fetchError.message}`)
  }

  let goalsNote = notes?.find((n) => n.metadata?.ontologyCategory === 'goals')
  let projectsNote = notes?.find((n) => n.metadata?.ontologyCategory === 'projects')
  let tasksNote = notes?.find((n) => n.metadata?.ontologyCategory === 'tasks')

  // Create notes if they don't exist
  if (!goalsNote) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: 'My Goals',
        content: '',
        note_type: 'ontology-aim',
        is_pinned: true,
        metadata: { ontologyCategory: 'goals', items: [] }
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create goals note: ${error.message}`)
    goalsNote = data
  }

  if (!projectsNote) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: 'My Projects',
        content: '',
        note_type: 'custom',
        is_pinned: true,
        metadata: { ontologyCategory: 'projects', items: [] }
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create projects note: ${error.message}`)
    projectsNote = data
  }

  if (!tasksNote) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: 'My Tasks',
        content: '',
        note_type: 'custom',
        is_pinned: true,
        metadata: { ontologyCategory: 'tasks', items: [] }
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create tasks note: ${error.message}`)
    tasksNote = data
  }

  // Generate sample data with proper IDs and relationships
  const goalItems: HierarchicalOntologyItem[] = []
  const projectItems: HierarchicalOntologyItem[] = []
  const taskItems: HierarchicalOntologyItem[] = []

  sampleGoals.forEach((sampleGoal, goalIndex) => {
    const goalId = crypto.randomUUID()
    goalItems.push({
      id: goalId,
      name: sampleGoal.name,
      confidence: 'high',
      parentId: undefined,
      order: goalIndex,
      excerpts: []
    })

    sampleGoal.projects.forEach((sampleProject, projectIndex) => {
      const projectId = crypto.randomUUID()
      projectItems.push({
        id: projectId,
        name: sampleProject.name,
        confidence: 'high',
        parentId: goalId,
        order: projectIndex,
        excerpts: []
      })

      sampleProject.tasks.forEach((sampleTask, taskIndex) => {
        taskItems.push({
          id: crypto.randomUUID(),
          name: sampleTask.name,
          confidence: 'high',
          parentId: projectId,
          order: taskIndex,
          excerpts: []
        })
      })
    })
  })

  // Update notes with sample data
  const updates = [
    supabase
      .from('notes')
      .update({ metadata: { ...goalsNote.metadata, items: goalItems } })
      .eq('id', goalsNote.id),
    supabase
      .from('notes')
      .update({ metadata: { ...projectsNote.metadata, items: projectItems } })
      .eq('id', projectsNote.id),
    supabase
      .from('notes')
      .update({ metadata: { ...tasksNote.metadata, items: taskItems } })
      .eq('id', tasksNote.id)
  ]

  const results = await Promise.all(updates)
  const errors = results.filter((r) => r.error)

  if (errors.length > 0) {
    throw new Error(`Failed to update notes: ${errors.map((e) => e.error?.message).join(', ')}`)
  }

  console.log(`✅ Successfully seeded execution stack:`)
  console.log(`   - ${goalItems.length} goals`)
  console.log(`   - ${projectItems.length} projects`)
  console.log(`   - ${taskItems.length} tasks`)
}

// Run script if called directly
if (require.main === module) {
  const userId = process.argv[2]

  if (!userId) {
    console.error('Usage: node scripts/seed-execution-stack.ts <user-id>')
    process.exit(1)
  }

  seedExecutionStack(userId)
    .then(() => {
      console.log('✨ Seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}
