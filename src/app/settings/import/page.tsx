/**
 * Settings > Import Page
 *
 * Allows users to import notes from external sources like Obsidian
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObsidianImportWizard } from '@/components/import/ObsidianImportWizard';

export const metadata: Metadata = {
  title: 'Import Notes | Signum',
  description: 'Import your notes from Obsidian or other note-taking apps',
};

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Import Notes
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Import your existing notes from Obsidian or other markdown-based
                note-taking apps
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Import Options */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Import Sources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Obsidian - Active */}
            <div className="p-6 rounded-lg border-2 border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Obsidian
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import your Obsidian vault with WikiLinks, tags, and frontmatter
                preserved
              </p>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                ✓ Available Now
              </div>
            </div>

            {/* LogSeq - Coming Soon */}
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                LogSeq
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import your LogSeq graph with block-based structure
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                🚧 Coming Soon
              </div>
            </div>

            {/* Notion - Coming Soon */}
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Notion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import Notion exports with formatting and structure
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                🚧 Coming Soon
              </div>
            </div>
          </div>
        </div>

        {/* Obsidian Import Wizard */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Import from Obsidian
          </h2>

          <ObsidianImportWizard />
        </div>

        {/* Import Tips */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Import Tips
          </h3>

          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>WikiLinks</strong>: [[Note Title]] links will be
                automatically converted to clickable links between your notes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>Frontmatter</strong>: YAML metadata will be preserved
                in note metadata
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>Tags</strong>: #tags will be extracted and stored with
                your notes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>File Size Limits</strong>: Maximum 10MB per file, 100MB
                total vault size
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>Broken Links</strong>: Links to non-existent notes will
                be preserved but marked as broken
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>
                <strong>Attachments</strong>: Image and file attachments will be
                supported in a future update
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
