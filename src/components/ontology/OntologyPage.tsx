'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Flag, ListChecks, Loader2, Pencil, Plus, Target, Users, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPinnedNotes, initializePinnedNotes, updateNote } from '@/lib/notes'
import { ConfidenceLevel, Note } from '@/types/note'
import { OntologyAnalysisButton } from '../notes/OntologyAnalysisButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

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
  return names.map((name) => {
    const existing = existingItems.find((item) => item.name === name)
    if (existing) {
      return {
        name: existing.name,
        confidence: (existing.confidence ?? 'high') as ConfidenceLevel,
        excerpts: Array.isArray(existing.excerpts) ? existing.excerpts : []
      }
    }
    return { name, confidence: 'high' as ConfidenceLevel, excerpts: [] }
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
  const [meaningDraft, setMeaningDraft] = useState('68')

  const loadNotes = useCallback(async () => {
    if (!user) return
    const notes = await getPinnedNotes(user.id)
    setPinnedNotes(notes)
    setIsLoading(false)
  }, [user])

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
    }
  }, [pinnedNotes])

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

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <Zap className="h-4 w-4" />
          Execution Stack
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Flag className="h-4 w-4 text-emerald-500" />
                Goals
              </div>
              {renderListEditor('goals', 'bg-emerald-50 text-emerald-800')}
            </CardContent>
          </Card>

          <Card className="border-sky-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Target className="h-4 w-4 text-sky-500" />
                Projects
              </div>
              {renderListEditor('projects', 'bg-sky-50 text-sky-800')}
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <ListChecks className="h-4 w-4 text-orange-500" />
                Tasks
              </div>
              {renderListEditor('tasks', 'bg-orange-50 text-orange-800')}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
