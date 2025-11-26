'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPinnedNotes, initializePinnedNotes, updateNote } from '@/lib/notes'
import { ConfidenceLevel, HierarchicalOntologyItem, Note } from '@/types/note'
import { OntologyAnalysisButton } from '../notes/OntologyAnalysisButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { GoalNode, ProjectNode, buildExecutionHierarchy, countDescendants, normalizeOntologyItems, resequenceByParent } from '@/lib/ontology/hierarchy'

type SectionKey =
  | 'higher-power'
  | 'beliefs'
  | 'values'
  | 'people'
  | 'mission'
  | 'goals'
  | 'projects'
  | 'tasks'

const SECTION_ORDER: SectionKey[] = [
  'higher-power',
  'beliefs',
  'values',
  'people',
  'mission',
  'goals',
  'projects',
  'tasks'
]

const DEFAULT_MEANING_INDEX = '68'
const fallbackId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

type DeleteTarget =
  | { category: 'goals'; item: GoalNode }
  | { category: 'projects'; item: ProjectNode; parentGoalId?: string }
  | {
      category: 'tasks'
      item: HierarchicalOntologyItem
      parentProjectId?: string
      parentGoalId?: string
    }

function resolveSectionKey(note: Note): SectionKey | null {
  if (note.metadata?.ontologyCategory && SECTION_ORDER.includes(note.metadata.ontologyCategory as SectionKey)) {
    return note.metadata.ontologyCategory as SectionKey
  }

  if (note.noteType === 'ontology-value') return 'values'
  if (note.noteType === 'ontology-belief') return 'beliefs'
  if (note.noteType === 'ontology-aim') return 'goals'

  return null
}

function getItemNames(note?: Note): string[] {
  if (!note) return []
  const items = Array.isArray(note.metadata?.items) ? note.metadata.items : []
  return items.map((item) => item.name).filter(Boolean)
}

function toPlainText(content?: string): string {
  if (!content) return ''
  return content.replace(/<[^>]*>?/gm, '').trim()
}

function mergeItems(note: Note, names: string[]) {
  const existingItems = Array.isArray(note.metadata?.items) ? note.metadata.items : []
  const normalizedExisting = existingItems.map((item, index) => ({
    id: (item as HierarchicalOntologyItem).id ?? (crypto?.randomUUID ? crypto.randomUUID() : fallbackId()),
    name: (item as HierarchicalOntologyItem).name,
    confidence: ((item as HierarchicalOntologyItem).confidence ?? 'high') as ConfidenceLevel,
    parentId: (item as HierarchicalOntologyItem).parentId,
    order: typeof (item as HierarchicalOntologyItem).order === 'number' ? (item as HierarchicalOntologyItem).order : index,
    excerpts: Array.isArray((item as HierarchicalOntologyItem).excerpts)
      ? (item as HierarchicalOntologyItem).excerpts
      : []
  }))

  return names.map((name, index) => {
    const existing = normalizedExisting.find((item) => item.name === name)
    if (existing) {
      return {
        ...existing,
        order: index
      }
    }
    return {
      id: crypto?.randomUUID ? crypto.randomUUID() : fallbackId(),
      name,
      confidence: 'high' as ConfidenceLevel,
      order: index,
      parentId: undefined,
      excerpts: []
    }
  })
}

export function OntologyPage() {
  const { user } = useAuth()
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Record<SectionKey, boolean>>>({})
  const [saving, setSaving] = useState<Partial<Record<SectionKey | 'meaning', boolean>>>({})
  const [textDrafts, setTextDrafts] = useState<Partial<Record<SectionKey, string>>>({})
  const [listDrafts, setListDrafts] = useState<Partial<Record<SectionKey, string[]>>>({})
  const [newListItem, setNewListItem] = useState<Partial<Record<SectionKey, string>>>({})
  const [meaningEditing, setMeaningEditing] = useState(false)
  const [meaningDraft, setMeaningDraft] = useState(DEFAULT_MEANING_INDEX)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [itemDrafts, setItemDrafts] = useState<{ goal: string; project: string; task: string }>({
    goal: '',
    project: '',
    task: ''
  })
  const [parentDrafts, setParentDrafts] = useState<{ projectParent: string; taskParent: string }>({
    projectParent: 'none',
    taskParent: 'none'
  })
  const [editTarget, setEditTarget] = useState<{ category: 'goals' | 'projects' | 'tasks'; id: string } | null>(null)
  const [editDraft, setEditDraft] = useState<{ name: string; parentId?: string }>({ name: '', parentId: undefined })
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleteChoice, setDeleteChoice] = useState<'delete' | 'reassign' | 'cancel'>('delete')
  const [reassignParent, setReassignParent] = useState<string | undefined>(undefined)
  const [normalizing, setNormalizing] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!user) return
    const notes = await getPinnedNotes(user.id)
    setPinnedNotes(notes)
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    // Reset meaning draft when switching users to avoid leaking prior user state
    setMeaningDraft(DEFAULT_MEANING_INDEX)
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      setPinnedNotes([])
      setIsLoading(false)
      return
    }

    ;(async () => {
      await initializePinnedNotes(user.id)
      await loadNotes()
    })()
  }, [user, loadNotes])

  useEffect(() => {
    const missionNote = pinnedNotes.find((note) => resolveSectionKey(note) === 'mission')
    if (missionNote?.metadata?.meaningIndex !== undefined) {
      setMeaningDraft(String(missionNote.metadata.meaningIndex))
    } else if (!meaningEditing) {
      setMeaningDraft(DEFAULT_MEANING_INDEX)
    }
  }, [pinnedNotes, meaningEditing])

  const meaningIndex = useMemo(() => {
    const missionNote = pinnedNotes.find((note) => resolveSectionKey(note) === 'mission')
    const draftNumber = Number(meaningDraft)
    const derivedDraft = Number.isNaN(draftNumber) ? 68 : draftNumber
    return missionNote?.metadata?.meaningIndex ?? derivedDraft
  }, [meaningDraft, pinnedNotes])

  const findNote = useCallback(
    (key: SectionKey) => pinnedNotes.find((note) => resolveSectionKey(note) === key),
    [pinnedNotes]
  )

  const goalsNote = findNote('goals')
  const projectsNote = findNote('projects')
  const tasksNote = findNote('tasks')

  const executionStack = useMemo(() => {
    const goalItems = normalizeOntologyItems(goalsNote?.metadata?.items as HierarchicalOntologyItem[]).normalized
    const projectItems = normalizeOntologyItems(projectsNote?.metadata?.items as HierarchicalOntologyItem[]).normalized
    const taskItems = normalizeOntologyItems(tasksNote?.metadata?.items as HierarchicalOntologyItem[]).normalized

    return {
      goalItems,
      projectItems,
      taskItems,
      hierarchy: buildExecutionHierarchy(goalItems, projectItems, taskItems)
    }
  }, [goalsNote?.metadata?.items, projectsNote?.metadata?.items, tasksNote?.metadata?.items])

  const allProjects = useMemo(
    () => [
      ...executionStack.hierarchy.unassignedProjects,
      ...executionStack.hierarchy.goals.flatMap((goal) => goal.projects)
    ],
    [executionStack.hierarchy]
  )

  useEffect(() => {
    setExpandedProjects((prev) => {
      const next = { ...prev }
      allProjects.forEach((project) => {
        if (next[project.id] === undefined) {
          next[project.id] = true
        }
      })
      return next
    })
  }, [allProjects])

  useEffect(() => {
    if (!user) return

    const normalizeAndPersist = async () => {
      const updates: Array<Promise<Note | null>> = []

      const queueUpdate = (key: SectionKey) => {
        const note = findNote(key)
        if (!note) return
        const { normalized, changed } = normalizeOntologyItems(
          note.metadata?.items as HierarchicalOntologyItem[]
        )
        if (changed) {
          updates.push(
            updateNote(
              note.id,
              {
                metadata: {
                  ...note.metadata,
                  ontologyCategory: note.metadata?.ontologyCategory ?? key,
                  items: normalized
                }
              },
              user.id
            )
          )
        }
      }

      queueUpdate('goals')
      queueUpdate('projects')
      queueUpdate('tasks')

      if (updates.length === 0) return

      setNormalizing(true)
      try {
        await Promise.all(updates)
        await loadNotes()
      } finally {
        setNormalizing(false)
      }
    }

    normalizeAndPersist()
  }, [findNote, loadNotes, pinnedNotes, user])

  const startTextEdit = (key: SectionKey) => {
    const note = findNote(key)
    setTextDrafts((prev) => ({ ...prev, [key]: toPlainText(note?.content) }))
    setEditing((prev) => ({ ...prev, [key]: true }))
  }

  const startListEdit = (key: SectionKey) => {
    const note = findNote(key)
    setListDrafts((prev) => ({ ...prev, [key]: getItemNames(note) }))
    setEditing((prev) => ({ ...prev, [key]: true }))
  }

  const cancelEdit = (key: SectionKey) => {
    setEditing((prev) => ({ ...prev, [key]: false }))
    setNewListItem((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSaveText = async (key: SectionKey) => {
    const note = findNote(key)
    if (!note || !user) return

    const draft = textDrafts[key] ?? ''
    setSaving((prev) => ({ ...prev, [key]: true }))

    try {
      await updateNote(
        note.id,
        {
          content: draft,
          metadata: {
            ...note.metadata,
            ontologyCategory: note.metadata?.ontologyCategory ?? key
          },
          isPinned: true
        },
        user.id
      )
      toast.success('Saved successfully')
      setEditing((prev) => ({ ...prev, [key]: false }))
      await loadNotes()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save changes')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleSaveList = async (key: SectionKey) => {
    const note = findNote(key)
    if (!note || !user) return

    const names = (listDrafts[key] || []).filter(Boolean)
    setSaving((prev) => ({ ...prev, [key]: true }))

    try {
      await updateNote(
        note.id,
        {
          metadata: {
            ...note.metadata,
            items: mergeItems(note, names),
            ontologyCategory: note.metadata?.ontologyCategory ?? key
          },
          isPinned: true
        },
        user.id
      )
      toast.success('Saved successfully')
      setEditing((prev) => ({ ...prev, [key]: false }))
      await loadNotes()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save changes')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleSaveMeaningIndex = async () => {
    const missionNote = findNote('mission')
    if (!missionNote || !user) return

    const parsed = Number(meaningDraft)
    if (Number.isNaN(parsed)) {
      toast.error('Enter a valid number')
      return
    }

    setSaving((prev) => ({ ...prev, meaning: true }))
    try {
      await updateNote(
        missionNote.id,
        {
          metadata: {
            ...missionNote.metadata,
            ontologyCategory: missionNote.metadata?.ontologyCategory ?? 'mission',
            meaningIndex: parsed
          }
        },
        user.id
      )
      toast.success('Meaning index updated')
      setMeaningEditing(false)
      await loadNotes()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update meaning index')
    } finally {
      setSaving((prev) => ({ ...prev, meaning: false }))
    }
  }

  const savingExecution = Boolean(saving.goals || saving.projects || saving.tasks || normalizing)

  const persistExecutionItems = async (
    key: 'goals' | 'projects' | 'tasks',
    items: HierarchicalOntologyItem[],
    options?: { skipReload?: boolean }
  ) => {
    const note = key === 'goals' ? goalsNote : key === 'projects' ? projectsNote : tasksNote
    if (!note || !user) return false

    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      await updateNote(
        note.id,
        {
          metadata: {
            ...note.metadata,
            ontologyCategory: note.metadata?.ontologyCategory ?? key,
            items: resequenceByParent(items)
          }
        },
        user.id
      )
      if (!options?.skipReload) {
        await loadNotes()
      }
      return true
    } catch (error) {
      console.error(error)
      toast.error('Failed to save changes')
      return false
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const reorderWithinParent = (
    items: HierarchicalOntologyItem[],
    itemId: string,
    direction: 'up' | 'down'
  ) => {
    const target = items.find((item) => item.id === itemId)
    if (!target) return null
    const parentKey = target.parentId ?? '__root__'
    const siblings = items
      .filter((item) => (item.parentId ?? '__root__') === parentKey)
      .sort((a, b) => a.order - b.order)
    const currentIndex = siblings.findIndex((item) => item.id === itemId)
    const swapIndex = currentIndex + (direction === 'up' ? -1 : 1)
    if (swapIndex < 0 || swapIndex >= siblings.length) return null

    const reordered = [...siblings]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(swapIndex, 0, moved)

    const orderMap = new Map<string, number>()
    reordered.forEach((item, index) => orderMap.set(item.id, index))

    return items.map((item) =>
      orderMap.has(item.id) ? { ...item, order: orderMap.get(item.id) ?? item.order } : item
    )
  }

  const handleAddGoal = async () => {
    const name = itemDrafts.goal.trim()
    if (!name) return
    const newItem: HierarchicalOntologyItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : fallbackId(),
      name,
      confidence: 'high',
      parentId: undefined,
      order: executionStack.goalItems.length,
      excerpts: []
    }
    await persistExecutionItems('goals', [...executionStack.goalItems, newItem])
    setItemDrafts((prev) => ({ ...prev, goal: '' }))
  }

  const handleAddProject = async () => {
    const name = itemDrafts.project.trim()
    if (!name) return
    const parentId = parentDrafts.projectParent === 'none' ? undefined : parentDrafts.projectParent
    const siblingCount = executionStack.projectItems.filter(
      (item) => (item.parentId ?? '') === (parentId ?? '')
    ).length
    const newItem: HierarchicalOntologyItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : fallbackId(),
      name,
      confidence: 'high',
      parentId,
      order: siblingCount,
      excerpts: []
    }
    await persistExecutionItems('projects', [...executionStack.projectItems, newItem])
    setItemDrafts((prev) => ({ ...prev, project: '' }))
    setParentDrafts((prev) => ({ ...prev, projectParent: 'none' }))
  }

  const handleAddTask = async () => {
    const name = itemDrafts.task.trim()
    if (!name) return
    const parentId = parentDrafts.taskParent === 'none' ? undefined : parentDrafts.taskParent
    const siblingCount = executionStack.taskItems.filter(
      (item) => (item.parentId ?? '') === (parentId ?? '')
    ).length
    const newItem: HierarchicalOntologyItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : fallbackId(),
      name,
      confidence: 'high',
      parentId,
      order: siblingCount,
      excerpts: []
    }
    await persistExecutionItems('tasks', [...executionStack.taskItems, newItem])
    setItemDrafts((prev) => ({ ...prev, task: '' }))
    setParentDrafts((prev) => ({ ...prev, taskParent: 'none' }))
  }

  const startEditItem = (
    category: 'goals' | 'projects' | 'tasks',
    item: HierarchicalOntologyItem
  ) => {
    setEditTarget({ category, id: item.id })
    setEditDraft({ name: item.name, parentId: item.parentId })
  }

  const cancelItemEdit = () => {
    setEditTarget(null)
    setEditDraft({ name: '', parentId: undefined })
  }

  const handleSaveEditItem = async () => {
    if (!editTarget) return
    const name = editDraft.name.trim()
    if (!name) return

    const sourceItems =
      editTarget.category === 'goals'
        ? executionStack.goalItems
        : editTarget.category === 'projects'
          ? executionStack.projectItems
          : executionStack.taskItems

    const target = sourceItems.find((item) => item.id === editTarget.id)
    if (!target) return

    const newParentId =
      editTarget.category === 'goals' ? undefined : (editDraft.parentId === 'none' ? undefined : editDraft.parentId)
    const moved = target.parentId !== newParentId

    const siblingCount = sourceItems.filter(
      (item) => (item.parentId ?? '') === (newParentId ?? '')
    ).length

    const updatedItems = sourceItems.map((item) =>
      item.id === target.id
        ? {
            ...item,
            name,
            parentId: newParentId,
            order: moved ? siblingCount : item.order
          }
        : item
    )

    await persistExecutionItems(editTarget.category, updatedItems)
    cancelItemEdit()
  }

  const handleReorderItem = async (
    category: 'goals' | 'projects' | 'tasks',
    itemId: string,
    direction: 'up' | 'down'
  ) => {
    const sourceItems =
      category === 'goals'
        ? executionStack.goalItems
        : category === 'projects'
          ? executionStack.projectItems
          : executionStack.taskItems
    const reordered = reorderWithinParent(sourceItems, itemId, direction)
    if (!reordered) return
    await persistExecutionItems(category, reordered)
  }

  const openDeleteDialog = (category: 'goals' | 'projects' | 'tasks', id: string) => {
    setDeleteChoice('delete')
    setReassignParent(undefined)
    if (category === 'goals') {
      const target = executionStack.hierarchy.goals.find((goal) => goal.id === id)
      if (target) {
        setDeleteTarget({ category: 'goals', item: target })
        const otherGoals = executionStack.goalItems.filter((goal) => goal.id !== id)
        if (otherGoals.length > 0) {
          setReassignParent(otherGoals[0].id)
        }
      }
    } else if (category === 'projects') {
      const target = allProjects.find((project) => project.id === id)
      if (target) {
        const parentGoal = executionStack.hierarchy.goals.find((goal) =>
          goal.projects.some((project) => project.id === id)
        )
        setDeleteTarget({ category: 'projects', item: target, parentGoalId: parentGoal?.id })
        const otherProjects = executionStack.projectItems.filter((project) => project.id !== id)
        if (otherProjects.length > 0) {
          setReassignParent(otherProjects[0].id)
        }
      }
    } else {
      const task = executionStack.taskItems.find((task) => task.id === id)
      if (task) {
        const parentProject = allProjects.find((project) => project.id === task.parentId)
        const parentGoal = executionStack.hierarchy.goals.find((goal) =>
          goal.projects.some((project) => project.id === parentProject?.id)
        )
        setDeleteTarget({
          category: 'tasks',
          item: task,
          parentProjectId: parentProject?.id,
          parentGoalId: parentGoal?.id
        })
      }
    }
  }

  const closeDeleteDialog = () => {
    setDeleteTarget(null)
    setDeleteChoice('delete')
    setReassignParent(undefined)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.category === 'tasks') {
      const updatedTasks = executionStack.taskItems.filter((task) => task.id !== deleteTarget.item.id)
      await persistExecutionItems('tasks', updatedTasks)
      closeDeleteDialog()
      return
    }

    if (deleteChoice === 'cancel') {
      closeDeleteDialog()
      return
    }

    if (deleteTarget.category === 'goals') {
      const goalId = deleteTarget.item.id
      const remainingGoals = executionStack.goalItems.filter((goal) => goal.id !== goalId)
      const affectedProjects = executionStack.projectItems.filter((project) => project.parentId === goalId)
      const affectedProjectIds = new Set(affectedProjects.map((p) => p.id))
      let updatedTasks = executionStack.taskItems
      let updatedProjects = executionStack.projectItems.filter((project) => project.parentId !== goalId)
      const updatedGoalItems = remainingGoals

      if (deleteChoice === 'reassign' && reassignParent) {
        updatedProjects = executionStack.projectItems.map((project) =>
          project.parentId === goalId ? { ...project, parentId: reassignParent } : project
        )
      } else if (deleteChoice === 'delete') {
        updatedTasks = executionStack.taskItems.filter(
          (task) => !affectedProjectIds.has(task.parentId ?? '')
        )
      }

      const updates = [
        persistExecutionItems('goals', updatedGoalItems, { skipReload: true }),
        persistExecutionItems('projects', updatedProjects, { skipReload: true }),
        persistExecutionItems('tasks', updatedTasks, { skipReload: true })
      ]
      await Promise.all(updates)
      await loadNotes()
      closeDeleteDialog()
      return
    }

    if (deleteTarget.category === 'projects') {
      const projectId = deleteTarget.item.id
      const remainingProjects = executionStack.projectItems.filter((project) => project.id !== projectId)
      const affectedTasks = executionStack.taskItems.filter((task) => task.parentId === projectId)
      let updatedTasks = executionStack.taskItems

      if (deleteChoice === 'reassign' && reassignParent) {
        const siblings = executionStack.taskItems.filter(
          (task) => (task.parentId ?? '') === reassignParent
        )
        let orderCursor = siblings.length
        updatedTasks = executionStack.taskItems.map((task) => {
          if (task.parentId !== projectId) return task
          return {
            ...task,
            parentId: reassignParent,
            order: orderCursor++
          }
        })
      } else if (deleteChoice === 'delete') {
        const idsToRemove = new Set(affectedTasks.map((task) => task.id))
        updatedTasks = executionStack.taskItems.filter((task) => !idsToRemove.has(task.id))
      }

      const updates = [
        persistExecutionItems('projects', remainingProjects, { skipReload: true }),
        persistExecutionItems('tasks', updatedTasks, { skipReload: true })
      ]
      await Promise.all(updates)
      await loadNotes()
      closeDeleteDialog()
    }
  }

  const renderChips = (items: string[], accent = 'bg-secondary/60 text-foreground') => {
    if (!items.length) return <p className="text-sm text-muted-foreground">No entries yet.</p>
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className={accent}>
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  const renderListEditor = (key: SectionKey, accent?: string) => {
    const note = findNote(key)
    const items = getItemNames(note)
    const draftItems = listDrafts[key] ?? items
    const isEditing = editing[key]

    const addItem = () => {
      const next = (newListItem[key] || '').trim()
      if (!next) return
      setListDrafts((prev) => ({ ...prev, [key]: [...draftItems, next] }))
      setNewListItem((prev) => ({ ...prev, [key]: '' }))
    }

    const removeItem = (index: number) => {
      const updated = [...draftItems]
      updated.splice(index, 1)
      setListDrafts((prev) => ({ ...prev, [key]: updated }))
    }

    return (
      <div className="space-y-4">
        {isEditing ? (
          <>
            <div className="flex flex-wrap gap-2">
              {draftItems.map((item, index) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className={`flex items-center gap-2 ${accent ?? ''}`}
                >
                  {item}
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => removeItem(index)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Input
                value={newListItem[key] || ''}
                onChange={(e) => setNewListItem((prev) => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem()
                  }
                }}
                placeholder="Add new item"
                className="w-48"
              />
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSaveList(key)} disabled={!!saving[key]}>
                {saving[key] && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEdit(key)} disabled={!!saving[key]}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {renderChips(items, accent)}
            <Button variant="ghost" size="sm" className="mt-1" onClick={() => startListEdit(key)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </>
        )}
      </div>
    )
  }

  const renderTextEditor = (key: SectionKey, placeholder?: string) => {
    const note = findNote(key)
    const content = toPlainText(note?.content)
    const isEditing = editing[key]

    return (
      <div className="space-y-3">
        {isEditing ? (
          <>
            <Textarea
              value={textDrafts[key] ?? content}
              onChange={(e) => setTextDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSaveText(key)} disabled={!!saving[key]}>
                {saving[key] && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEdit(key)} disabled={!!saving[key]}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base leading-relaxed text-slate-800">
              {content || placeholder || 'Add your perspective.'}
            </p>
            <Button variant="ghost" size="sm" onClick={() => startTextEdit(key)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-10 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Ontology</h1>
              <p className="text-sm text-muted-foreground">Map of meaning &amp; action</p>
            </div>
            <div className="flex flex-col gap-2 md:items-end w-full md:w-auto">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Progress value={meaningIndex} className="h-2 w-full md:w-56" />
                <div className="flex items-center gap-2">
                  {meaningEditing ? (
                    <>
                      <Input
                        type="number"
                        value={meaningDraft}
                        onChange={(e) => setMeaningDraft(e.target.value)}
                        className="w-20"
                        min={0}
                        max={100}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveMeaningIndex}
                        disabled={!!saving.meaning}
                      >
                        {saving.meaning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setMeaningEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-semibold text-slate-900">{meaningIndex}</span>
                      <Button variant="ghost" size="sm" onClick={() => setMeaningEditing(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <OntologyAnalysisButton onComplete={loadNotes} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-200 shadow-sm bg-gradient-to-b from-white to-violet-50">
        <CardContent className="p-8 text-center space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-500">
            Higher Order / Power
          </div>
          {renderTextEditor(
            'higher-power',
            'What is bigger than you that you serve? Capture the force, philosophy, or faith that guides you.'
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-purple-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-purple-500">
              <Zap className="h-4 w-4" />
              Beliefs
            </div>
            {renderListEditor('beliefs', 'bg-purple-50 text-purple-800')}
          </CardContent>
        </Card>

        <Card className="border-pink-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-pink-500">
              <Target className="h-4 w-4" />
              Values
            </div>
            {renderListEditor('values', 'bg-pink-50 text-pink-800')}
          </CardContent>
        </Card>

        <Card className="border-indigo-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-indigo-500">
              <Users className="h-4 w-4" />
              People
            </div>
            {renderListEditor('people', 'bg-indigo-50 text-indigo-800')}
          </CardContent>
        </Card>
      </div>

      <Card className="border-violet-200 shadow-sm bg-gradient-to-b from-white to-indigo-50">
        <CardContent className="p-8 space-y-3">
          <div className="text-center space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-500">
              Mission
            </div>
            {renderTextEditor(
              'mission',
              'Define the mission that ties your beliefs and values to action.'
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Execution Stack (Goal Columns)
          </div>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Goal name"
              placeholder="Add a goal"
              value={itemDrafts.goal}
              onChange={(e) => setItemDrafts((prev) => ({ ...prev, goal: e.target.value }))}
              className="w-48"
            />
            <Button size="sm" onClick={handleAddGoal} disabled={savingExecution}>
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
            {normalizing && (
              <span className="text-xs text-muted-foreground">Upgrading data…</span>
            )}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {executionStack.hierarchy.goals.map((goal, goalIndex) => {
            const counts = countDescendants(goal)
            return (
              <section
                key={goal.id}
                role="region"
                aria-label={`Goal column ${goalIndex + 1} of ${executionStack.hierarchy.goals.length}: ${goal.name}, ${goal.projects.length} projects, ${counts.tasks} tasks`}
                className="min-w-[280px] max-w-[320px]"
              >
                <Card className="h-full border border-emerald-100">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-emerald-700">
                          {goal.name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {goal.projects.length} projects • {counts.tasks} tasks
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditItem('goals', goal)}
                          aria-label={`Edit ${goal.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog('goals', goal.id)}
                          aria-label={`Delete ${goal.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {editTarget?.id === goal.id && editTarget.category === 'goals' && (
                      <div className="space-y-2">
                        <Input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEditItem} disabled={savingExecution}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelItemEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Input
                        aria-label={`Add project to ${goal.name}`}
                        placeholder="Add project"
                        value={itemDrafts.project}
                        onChange={(e) => setItemDrafts((prev) => ({ ...prev, project: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            setParentDrafts((prev) => ({ ...prev, projectParent: goal.id }))
                            handleAddProject()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setParentDrafts((prev) => ({ ...prev, projectParent: goal.id }))
                            handleAddProject()
                          }}
                          disabled={savingExecution}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Project
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {goal.projects.length === 0 && (
                        <p className="text-sm text-muted-foreground">No projects yet.</p>
                      )}
                      {goal.projects.map((project) => {
                        const projectExpanded = expandedProjects[project.id] ?? true
                        const isEditing =
                          editTarget?.id === project.id && editTarget.category === 'projects'
                        return (
                          <div key={project.id} className="rounded-md border border-slate-200 bg-white">
                            <div className="flex items-start justify-between px-3 py-2">
                              <div className="flex items-start gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setExpandedProjects((prev) => ({
                                      ...prev,
                                      [project.id]: !projectExpanded
                                    }))
                                  }
                                  aria-expanded={projectExpanded}
                                  aria-label={`${projectExpanded ? 'Collapse' : 'Expand'} ${project.name}`}
                                >
                                  {projectExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <p className="font-medium text-slate-900">{project.name}</p>
                                  <p className="text-xs text-muted-foreground">{project.tasks.length} tasks</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReorderItem('projects', project.id, 'up')}
                                  aria-label={`Move ${project.name} up`}
                                  disabled={savingExecution}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReorderItem('projects', project.id, 'down')}
                                  aria-label={`Move ${project.name} down`}
                                  disabled={savingExecution}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditItem('projects', project)}
                                  aria-label={`Edit ${project.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog('projects', project.id)}
                                  aria-label={`Delete ${project.name}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="px-3 pb-2 space-y-2">
                                <Input
                                  value={editDraft.name}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                />
                                <Select
                                  value={editDraft.parentId ?? goal.id}
                                  onValueChange={(value) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      parentId: value === 'none' ? undefined : value
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Parent goal" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None (Unassigned)</SelectItem>
                                    {executionStack.hierarchy.goals.map((goalOption) => (
                                      <SelectItem key={goalOption.id} value={goalOption.id}>
                                        {goalOption.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEditItem} disabled={savingExecution}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelItemEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {projectExpanded && (
                              <div className="px-3 pb-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    aria-label={`Add task to ${project.name}`}
                                    placeholder="Add task"
                                    value={itemDrafts.task}
                                    onChange={(e) => setItemDrafts((prev) => ({ ...prev, task: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        setParentDrafts((prev) => ({ ...prev, taskParent: project.id }))
                                        handleAddTask()
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setParentDrafts((prev) => ({ ...prev, taskParent: project.id }))
                                      handleAddTask()
                                    }}
                                    disabled={savingExecution}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Task
                                  </Button>
                                </div>

                                <ul className="space-y-2" role="list" aria-label={`Tasks for ${project.name}`}>
                                  {project.tasks.length === 0 && (
                                    <li className="text-sm text-muted-foreground">No tasks yet.</li>
                                  )}
                                  {project.tasks.map((task) => {
                                    const isEditingTask =
                                      editTarget?.id === task.id && editTarget.category === 'tasks'
                                    return (
                                      <li
                                        key={task.id}
                                        className="rounded-md border border-slate-200 bg-white p-2"
                                      >
                                        {isEditingTask ? (
                                          <div className="space-y-2">
                                            <Input
                                              value={editDraft.name}
                                              onChange={(e) =>
                                                setEditDraft((prev) => ({
                                                  ...prev,
                                                  name: e.target.value
                                                }))
                                              }
                                            />
                                            <Select
                                              value={editDraft.parentId ?? project.id}
                                              onValueChange={(value) =>
                                                setEditDraft((prev) => ({
                                                  ...prev,
                                                  parentId: value === 'none' ? undefined : value
                                                }))
                                              }
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Parent project" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">None (Unassigned)</SelectItem>
                                                {executionStack.hierarchy.goals.map((goalOption) =>
                                                  goalOption.projects.map((projectOption) => (
                                                    <SelectItem key={projectOption.id} value={projectOption.id}>
                                                      {goalOption.name} • {projectOption.name}
                                                    </SelectItem>
                                                  ))
                                                )}
                                                {executionStack.hierarchy.unassignedProjects.map((projectOption) => (
                                                  <SelectItem key={projectOption.id} value={projectOption.id}>
                                                    Unassigned • {projectOption.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <div className="flex gap-2">
                                              <Button size="sm" onClick={handleSaveEditItem} disabled={savingExecution}>
                                                Save
                                              </Button>
                                              <Button size="sm" variant="ghost" onClick={cancelItemEdit}>
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <p className="font-medium text-slate-900">☑ {task.name}</p>
                                              <p className="text-xs text-muted-foreground">Parent: {project.name}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleReorderItem('tasks', task.id, 'up')}
                                                aria-label={`Move ${task.name} up`}
                                                disabled={savingExecution}
                                              >
                                                <ArrowUp className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleReorderItem('tasks', task.id, 'down')}
                                                aria-label={`Move ${task.name} down`}
                                                disabled={savingExecution}
                                              >
                                                <ArrowDown className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEditItem('tasks', task)}
                                                aria-label={`Edit ${task.name}`}
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog('tasks', task.id)}
                                                aria-label={`Delete ${task.name}`}
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )
          })}
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) closeDeleteDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.category === 'goals' && `Delete goal "${deleteTarget.item.name}"?`}
              {deleteTarget?.category === 'projects' && `Delete project "${deleteTarget.item.name}"?`}
              {deleteTarget?.category === 'tasks' && `Delete task "${deleteTarget.item.name}"?`}
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {deleteTarget?.category === 'goals' && (
                <p>
                  This goal contains {countDescendants(deleteTarget.item).projects} projects and{' '}
                  {countDescendants(deleteTarget.item).tasks} tasks.
                </p>
              )}
              {deleteTarget?.category === 'projects' && (
                <p>This project contains {deleteTarget.item.tasks.length} tasks.</p>
              )}
              {deleteTarget?.category === 'tasks' && (
                <p>This will delete the task. This action cannot be undone.</p>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && deleteTarget.category !== 'tasks' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose deletion strategy</Label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="delete-mode"
                    value="delete"
                    checked={deleteChoice === 'delete'}
                    onChange={() => setDeleteChoice('delete')}
                  />
                  <div>
                    <div className="font-medium text-destructive">Delete All (default)</div>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove this item and all of its descendants.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="delete-mode"
                    value="reassign"
                    checked={deleteChoice === 'reassign'}
                    onChange={() => setDeleteChoice('reassign')}
                    disabled={
                      deleteTarget.category === 'goals'
                        ? executionStack.goalItems.filter((goal) => goal.id !== deleteTarget.item.id).length === 0
                        : executionStack.projectItems.filter((project) => project.id !== deleteTarget.item.id).length === 0
                    }
                  />
                  <div>
                    <div className="font-medium">Reassign to Another {deleteTarget.category === 'goals' ? 'Goal' : 'Project'}</div>
                    <p className="text-xs text-muted-foreground">
                      Move all descendants to a new parent before deleting this item.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="delete-mode"
                    value="cancel"
                    checked={deleteChoice === 'cancel'}
                    onChange={() => setDeleteChoice('cancel')}
                  />
                  <div>
                    <div className="font-medium">Cancel</div>
                    <p className="text-xs text-muted-foreground">Abort this deletion.</p>
                  </div>
                </label>
              </div>

              {deleteChoice === 'reassign' && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Reassign to</Label>
                  <Select
                    value={reassignParent ?? 'none'}
                    onValueChange={(value) => setReassignParent(value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {deleteTarget.category === 'goals' &&
                        executionStack.goalItems
                          .filter((goal) => goal.id !== deleteTarget.item.id)
                          .map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.name}
                            </SelectItem>
                          ))}
                      {deleteTarget.category === 'projects' &&
                        executionStack.projectItems
                          .filter((project) => project.id !== deleteTarget.item.id)
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
