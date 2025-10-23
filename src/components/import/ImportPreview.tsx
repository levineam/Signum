'use client';

/**
 * ImportPreview Component
 *
 * Shows list of files to be imported with checkboxes for selection
 * Displays file count, total size, and allows deselection
 */

import { FileText, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UploadedFile } from './FileUploadZone';

interface ImportPreviewProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onImport: () => void;
  onCancel: () => void;
}

export function ImportPreview({
  files,
  onFilesChange,
  onImport,
  onCancel,
}: ImportPreviewProps) {
  const selectedCount = files.filter((f) => f.selected).length;
  const totalSize = files.reduce(
    (sum, f) => (f.selected ? sum + f.size : sum),
    0
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleFile = (index: number) => {
    const updated = [...files];
    updated[index].selected = !updated[index].selected;
    onFilesChange(updated);
  };

  const toggleAll = () => {
    const allSelected = files.every((f) => f.selected);
    const updated = files.map((f) => ({ ...f, selected: !allSelected }));
    onFilesChange(updated);
  };

  const allSelected = files.every((f) => f.selected);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Import Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Files
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {files.length}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selected
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {selectedCount}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Size
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatSize(totalSize)}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Files to Import
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="text-sm"
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Select All
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Checkbox
                  checked={file.selected}
                  onCheckedChange={() => toggleFile(index)}
                />

                <FileText className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={onImport}
          disabled={selectedCount === 0}
        >
          Import {selectedCount} {selectedCount === 1 ? 'Note' : 'Notes'}
        </Button>
      </div>
    </div>
  );
}
