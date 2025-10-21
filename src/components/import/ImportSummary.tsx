'use client';

/**
 * ImportSummary Component
 *
 * Shows final results of import process
 * Displays success count, errors, broken links, and skipped files
 */

import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ImportSummaryProps {
  notesImported: number;
  linksResolved: number;
  brokenLinks: Array<{
    sourceTitle: string;
    targetTitle: string;
    wikiLink: string;
  }>;
  skippedFiles: Array<{
    fileName: string;
    reason: string;
  }>;
  errors: string[];
  onViewNotes: () => void;
  onClose: () => void;
}

export function ImportSummary({
  notesImported,
  linksResolved,
  brokenLinks,
  skippedFiles,
  errors,
  onViewNotes,
  onClose,
}: ImportSummaryProps) {
  const hasIssues =
    brokenLinks.length > 0 || skippedFiles.length > 0 || errors.length > 0;

  const downloadLog = () => {
    const log = {
      timestamp: new Date().toISOString(),
      summary: {
        notesImported,
        linksResolved,
        brokenLinksCount: brokenLinks.length,
        skippedFilesCount: skippedFiles.length,
        errorsCount: errors.length,
      },
      brokenLinks,
      skippedFiles,
      errors,
    };

    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Success Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center h-12 w-12 rounded-full ${
            hasIssues
              ? 'bg-yellow-100 dark:bg-yellow-900'
              : 'bg-green-100 dark:bg-green-900'
          }`}
        >
          {hasIssues ? (
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {hasIssues ? 'Import Complete with Warnings' : 'Import Successful!'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notesImported} {notesImported === 1 ? 'note' : 'notes'} imported to
            Signum
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-700 dark:text-green-400 mb-1">
            Notes Imported
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {notesImported}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
            Links Resolved
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {linksResolved}
          </p>
        </div>

        {brokenLinks.length > 0 && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">
              Broken Links
            </p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {brokenLinks.length}
            </p>
          </div>
        )}

        {skippedFiles.length > 0 && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900">
            <p className="text-sm text-orange-700 dark:text-orange-400 mb-1">
              Skipped Files
            </p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {skippedFiles.length}
            </p>
          </div>
        )}
      </div>

      {/* Issues Details */}
      {hasIssues && (
        <Accordion type="multiple" className="w-full">
          {brokenLinks.length > 0 && (
            <AccordionItem value="broken-links">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Broken Links ({brokenLinks.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {brokenLinks.map((link, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {link.sourceTitle}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Missing link: {link.wikiLink} → {link.targetTitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}

          {skippedFiles.length > 0 && (
            <AccordionItem value="skipped-files">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-600" />
                  Skipped Files ({skippedFiles.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {skippedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {file.fileName}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {file.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}

          {errors.length > 0 && (
            <AccordionItem value="errors">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Errors ({errors.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {errors.map((error, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-sm"
                      >
                        <p className="text-red-900 dark:text-red-100">
                          {error}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button variant="outline" size="lg" onClick={downloadLog}>
          <Download className="h-4 w-4 mr-2" />
          Download Log
        </Button>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>

          <Button variant="default" size="lg" onClick={onViewNotes}>
            View Imported Notes
          </Button>
        </div>
      </div>
    </div>
  );
}
