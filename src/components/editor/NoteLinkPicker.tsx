'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { createClient } from '@/lib/supabase/client'

interface Note {
  id: string
  title: string
  noteType: string
  createdAt: string
  metadata?: {
    journalDate?: string
  }
}

interface NoteLinkPickerProps {
  onSelect: (note: Note) => void
  isGuest?: boolean
}

export function NoteLinkPicker({ onSelect, isGuest = false }: NoteLinkPickerProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchNotes() {
      if (isGuest) {
        // In guest mode, no notes available
        setNotes([])
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Fetch all notes and journal entries
        // Note: Database columns use snake_case (note_type, created_at, updated_at)
        const { data, error } = await supabase
          .from('notes')
          .select('id, title, note_type, created_at, metadata')
          .in('note_type', ['custom', 'journal-entry'])
          .order('updated_at', { ascending: false })
          .limit(100)

        if (error) throw error

        // Cast Supabase data to our Note interface (snake_case -> camelCase)
        const notes = (data || []).map(row => ({
          id: String(row.id),
          title: String(row.title),
          noteType: String(row.note_type),
          createdAt: String(row.created_at),
          metadata: row.metadata as { journalDate?: string } | undefined
        }))

        setNotes(notes)
      } catch (error) {
        console.error('Error fetching notes:', error)
        setNotes([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [isGuest])

  // Filter notes based on search query
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase()
    return note.title.toLowerCase().includes(query)
  })

  // Group notes by type
  const customNotes = filteredNotes.filter((n) => n.noteType === 'custom')
  const journalEntries = filteredNotes.filter((n) => n.noteType === 'journal-entry')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isGuest) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>Note linking is not available in guest mode.</p>
        <p className="mt-2">Sign in to link notes and journal entries.</p>
      </div>
    )
  }

  return (
    <Command className="rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search notes and journal entries..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      </div>
      <CommandList>
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notes...
          </div>
        ) : (
          <>
            <CommandEmpty>No notes found.</CommandEmpty>

            {customNotes.length > 0 && (
              <CommandGroup heading="Notes">
                {customNotes.map((note) => (
                  <CommandItem
                    key={note.id}
                    value={note.id}
                    onSelect={() => onSelect(note)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {journalEntries.length > 0 && (
              <CommandGroup heading="Journal Entries">
                {journalEntries.map((note) => (
                  <CommandItem
                    key={note.id}
                    value={note.id}
                    onSelect={() => onSelect(note)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {note.metadata?.journalDate
                          ? formatDate(note.metadata.journalDate)
                          : formatDate(note.createdAt)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </Command>
  )
}
