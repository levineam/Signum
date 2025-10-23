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
import { supabase } from '@/lib/supabase';
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
    const VERCEL_LIMIT_MB = 4.0; // Conservative limit (Vercel allows 4.5MB, we use 4MB to be safe)
    const VERCEL_LIMIT_BYTES = VERCEL_LIMIT_MB * 1024 * 1024;

    setImportProgress({
      total: selectedFiles.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
    });

    try {
      // Group files into chunks that fit within Vercel's payload limit
      const chunks: UploadedFile[][] = [];
      let currentChunk: UploadedFile[] = [];
      let currentChunkSize = 0;

      for (const file of selectedFiles) {
        const filePayload = JSON.stringify({
          fileName: file.fileName,
          relativePath: file.relativePath,
          content: file.content,
          size: file.size,
        });
        const fileSize = new Blob([filePayload]).size;

        // If adding this file would exceed the limit, start a new chunk
        if (currentChunk.length > 0 && currentChunkSize + fileSize > VERCEL_LIMIT_BYTES) {
          chunks.push([...currentChunk]);
          currentChunk = [];
          currentChunkSize = 0;
        }

        currentChunk.push(file);
        currentChunkSize += fileSize;
      }

      // Don't forget the last chunk
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      console.log(`Importing ${selectedFiles.length} files in ${chunks.length} chunk(s)`);

      // Import each chunk sequentially
      let totalImported = 0;
      let totalLinksResolved = 0;
      const allBrokenLinks: Array<{
        sourceTitle: string;
        targetTitle: string;
        wikiLink: string;
      }> = [];
      const allSkippedFiles: Array<{ fileName: string; reason: string }> = [];
      const allErrors: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        setImportProgress((prev) => ({
          ...prev,
          currentFile: `Processing batch ${i + 1}/${chunks.length} (${chunk.length} files)`,
        }));

        const payload = JSON.stringify({
          files: chunk.map((f) => ({
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

        // Get access token for Authorization header (fallback for Vercel previews)
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/import/obsidian', {
          method: 'POST',
          headers,
          credentials: 'include', // Required for cookies (auth session)
          body: payload,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Import failed';

          if (response.status === 413) {
            errorMessage = `Batch ${i + 1} too large. This should not happen - please report this bug.`;
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

        // Accumulate results from all chunks
        totalImported += result.summary.notesImported;
        totalLinksResolved += result.summary.linksResolved;
        allBrokenLinks.push(...result.summary.brokenLinks);
        allSkippedFiles.push(...result.summary.skippedFiles);
        allErrors.push(...result.summary.errors);

        setImportProgress((prev) => ({
          ...prev,
          processed: prev.processed + chunk.length,
          succeeded: prev.succeeded + result.summary.notesImported,
        }));
      }

      setImportSummary({
        notesImported: totalImported,
        linksResolved: totalLinksResolved,
        brokenLinks: allBrokenLinks,
        skippedFiles: allSkippedFiles,
        errors: allErrors,
      });

      setStep('summary');
      toast.success(
        chunks.length > 1
          ? `Successfully imported ${totalImported} notes in ${chunks.length} batches!`
          : `Successfully imported ${totalImported} notes!`
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
