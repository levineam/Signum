'use client';

/**
 * ObsidianImportWizard Component
 *
 * Main wizard flow for importing Obsidian vaults
 * Manages state through upload → preview → import → summary steps
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileUploadZone, type UploadedFile } from './FileUploadZone';
import { ImportPreview } from './ImportPreview';
import { ImportProgress } from './ImportProgress';
import { ImportSummary } from './ImportSummary';

type WizardStep = 'upload' | 'preview' | 'importing' | 'summary';

interface ImportProgressState {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentFile?: string;
}

interface ImportSummaryState {
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
}

export function ObsidianImportWizard() {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgressState>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
  });
  const [importSummary, setImportSummary] = useState<ImportSummaryState>({
    notesImported: 0,
    linksResolved: 0,
    brokenLinks: [],
    skippedFiles: [],
    errors: [],
  });

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setStep('preview');
  };

  const handleCancel = () => {
    setFiles([]);
    setStep('upload');
  };

  const handleImport = async () => {
    setStep('importing');

    const selectedFiles = files.filter((f) => f.selected);

    // Check payload size before sending (Vercel limit: 4.5MB for Hobby, 6MB for Pro)
    const payload = JSON.stringify({
      files: selectedFiles.map((f) => ({
        fileName: f.fileName,
        relativePath: f.relativePath,
        content: f.content,
        size: f.size,
      })),
      options: {
        preserveTimestamps: true,
        importTags: true,
        skipBrokenLinks: false,
      },
    });

    const payloadSizeMB = new Blob([payload]).size / (1024 * 1024);
    const VERCEL_LIMIT_MB = 4.5; // Conservative limit for Vercel Hobby plan

    if (payloadSizeMB > VERCEL_LIMIT_MB) {
      toast.error(
        `Import too large (${payloadSizeMB.toFixed(2)}MB). Vercel limit is ${VERCEL_LIMIT_MB}MB. Please import fewer files at once or use smaller files.`
      );
      setStep('preview');
      return;
    }

    setImportProgress({
      total: selectedFiles.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
    });

    try {
      const response = await fetch('/api/import/obsidian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Import failed';

        // Handle 413 specifically
        if (response.status === 413) {
          errorMessage = `Request too large (${payloadSizeMB.toFixed(2)}MB). Please import fewer files at once.`;
        } else {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      setImportSummary({
        notesImported: result.summary.notesImported,
        linksResolved: result.summary.linksResolved,
        brokenLinks: result.summary.brokenLinks,
        skippedFiles: result.summary.skippedFiles,
        errors: result.summary.errors,
      });

      setImportProgress({
        total: selectedFiles.length,
        processed: selectedFiles.length,
        succeeded: result.summary.notesImported,
        failed:
          selectedFiles.length -
          result.summary.notesImported -
          result.summary.skippedFiles.length,
      });

      setStep('summary');

      toast.success(
        `Successfully imported ${result.summary.notesImported} notes!`
      );
    } catch (error) {
      console.error('Import error:', error);

      setImportSummary({
        notesImported: 0,
        linksResolved: 0,
        brokenLinks: [],
        skippedFiles: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
      });

      setStep('summary');

      toast.error('Import failed. Please try again.');
    }
  };

  const handleViewNotes = () => {
    router.push('/notes');
  };

  const handleClose = () => {
    setFiles([]);
    setStep('upload');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {step === 'upload' && (
        <FileUploadZone onFilesSelected={handleFilesSelected} />
      )}

      {step === 'preview' && (
        <ImportPreview
          files={files}
          onFilesChange={setFiles}
          onImport={handleImport}
          onCancel={handleCancel}
        />
      )}

      {step === 'importing' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <ImportProgress {...importProgress} />
        </div>
      )}

      {step === 'summary' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <ImportSummary
            {...importSummary}
            onViewNotes={handleViewNotes}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
