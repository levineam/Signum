'use client';

/**
 * ImportProgress Component
 *
 * Shows real-time progress during import processing
 * Displays progress bar, current file, and statistics
 */

import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressProps {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentFile?: string;
}

export function ImportProgress({
  total,
  processed,
  succeeded,
  failed,
  currentFile,
}: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Loader2 className="h-8 w-8 text-amber-600 dark:text-amber-500 animate-spin flex-shrink-0" />

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Importing Notes...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentFile ? `Processing: ${currentFile}` : 'Processing files...'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {processed} / {total} files ({percentage}%)
          </span>
        </div>

        <Progress value={percentage} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Succeeded</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-500">
            {succeeded}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Failed</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-500">
            {failed}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Remaining</p>
          <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
            {total - processed}
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Please wait while we import your notes. This may take a minute...
      </p>
    </div>
  );
}
