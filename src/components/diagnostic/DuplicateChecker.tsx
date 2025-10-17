'use client'

/**
 * Diagnostic Component: Check for and clean up duplicate journal entries
 * Temporary utility for debugging duplicate Today entries issue
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
  const [report, setReport] = useState<DuplicateReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<{ success: boolean; deletedCount: number; message: string } | null>(null)

  const checkDuplicates = async () => {
    setLoading(true)
    setCleanupResult(null)
    try {
      const response = await fetch('/api/journal/cleanup-duplicates')
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error checking duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  const cleanupDuplicates = async () => {
    if (!confirm('This will delete duplicate journal entries, keeping only the most recent version of each date. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/journal/cleanup-duplicates', {
        method: 'POST'
      })
      const data = await response.json()
      setCleanupResult(data)
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

              {report.duplicates.length > 0 && (
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
