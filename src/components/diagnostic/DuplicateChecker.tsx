'use client'

/**
 * Diagnostic Component: Check for and clean up duplicate journal entries
 * Temporary utility for debugging duplicate Today entries issue
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface DuplicateReport {
  totalJournalEntries: number
  duplicateDates: number
  duplicates: Array<{
    date: string
    count: number
    entries: Array<{
      id: string
      title: string
      created_at: string
      updated_at: string
    }>
  }>
}

export function DuplicateChecker() {
  const { user } = useAuth()
  const [report, setReport] = useState<DuplicateReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<{ success: boolean; deletedCount: number; message: string } | null>(null)

  const checkDuplicates = async () => {
    if (!user) return

    setLoading(true)
    setCleanupResult(null)
    try {
      // Get all journal entries for user
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, title, created_at, updated_at, metadata')
        .eq('user_id', user.id)
        .eq('note_type', 'journal-entry')
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Error fetching notes:', notesError)
        setReport(null)
        return
      }

      // Group by journalDate to find duplicates
      const dateGroups = new Map<string, typeof notes>()

      for (const note of notes || []) {
        const journalDate = note.metadata?.journalDate || note.created_at.split('T')[0]
        if (!dateGroups.has(journalDate)) {
          dateGroups.set(journalDate, [])
        }
        dateGroups.get(journalDate)!.push(note)
      }

      // Find dates with duplicates
      const duplicates = Array.from(dateGroups.entries())
        .filter(([_, entries]) => entries.length > 1)
        .map(([date, entries]) => ({
          date,
          count: entries.length,
          entries: entries.map(e => ({
            id: e.id,
            title: e.title,
            created_at: e.created_at,
            updated_at: e.updated_at
          }))
        }))

      setReport({
        totalJournalEntries: notes?.length || 0,
        duplicateDates: duplicates.length,
        duplicates
      })
    } catch (error) {
      console.error('Error checking duplicates:', error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const cleanupDuplicates = async () => {
    if (!user || !report) return

    if (!confirm('This will delete duplicate journal entries, keeping only the most recent version of each date. Continue?')) {
      return
    }

    setLoading(true)
    try {
      // Get all journal entries for user
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('note_type', 'journal-entry')
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Error fetching notes:', notesError)
        return
      }

      // Group by journalDate
      const dateGroups = new Map<string, typeof notes>()

      for (const note of notes || []) {
        const journalDate = note.metadata?.journalDate || note.created_at.split('T')[0]
        if (!dateGroups.has(journalDate)) {
          dateGroups.set(journalDate, [])
        }
        dateGroups.get(journalDate)!.push(note)
      }

      // For each date with duplicates, keep the most recent (by updated_at) and delete the rest
      const deletedIds: string[] = []

      for (const [_, entries] of dateGroups.entries()) {
        if (entries.length > 1) {
          // Sort by updated_at descending (most recent first)
          const sorted = [...entries].sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )

          // Keep the first (most recent), delete the rest
          const toDelete = sorted.slice(1)

          for (const entry of toDelete) {
            const { error: deleteError } = await supabase
              .from('notes')
              .delete()
              .eq('id', entry.id)
              .eq('user_id', user.id) // Safety check

            if (!deleteError) {
              deletedIds.push(entry.id)
            } else {
              console.error(`Failed to delete ${entry.id}:`, deleteError)
            }
          }
        }
      }

      setCleanupResult({
        success: true,
        deletedCount: deletedIds.length,
        message: `Cleaned up ${deletedIds.length} duplicate journal entries`
      })

      // Refresh the report
      await checkDuplicates()
    } catch (error) {
      console.error('Error cleaning duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto mb-6 bg-yellow-50 border-yellow-200">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            🔧 Diagnostic Tool: Duplicate Journal Entries
          </h2>
          <p className="text-sm text-yellow-700">
            Temporary tool to check for and clean up duplicate journal entries created before the useEffect bug fix.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={checkDuplicates}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Checking...' : 'Check for Duplicates'}
          </Button>

          {report && report.duplicateDates > 0 && (
            <Button
              onClick={cleanupDuplicates}
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              Clean Up Duplicates
            </Button>
          )}
        </div>

        {cleanupResult && (
          <div className="p-4 bg-green-100 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-900">
              ✅ {cleanupResult.message}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Deleted {cleanupResult.deletedCount} duplicate entries
            </p>
          </div>
        )}

        {report && (
          <div className="p-4 bg-white border border-yellow-200 rounded-md">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Total Journal Entries:</strong> {report.totalJournalEntries}
              </p>
              <p>
                <strong>Dates with Duplicates:</strong> {report.duplicateDates}
              </p>

              {report.duplicates && report.duplicates.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Duplicate Entries:</p>
                  <div className="space-y-3">
                    {report.duplicates.map((dup) => (
                      <div key={dup.date} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="font-medium">
                          Date: {dup.date} ({dup.count} entries)
                        </p>
                        <div className="mt-2 space-y-1 text-xs">
                          {dup.entries.map((entry) => (
                            <div key={entry.id} className="pl-4 border-l-2 border-yellow-300">
                              <p className="font-mono">{entry.id.substring(0, 8)}...</p>
                              <p>Created: {new Date(entry.created_at).toLocaleString()}</p>
                              <p>Updated: {new Date(entry.updated_at).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
