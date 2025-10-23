'use client';

/**
 * FileUploadZone Component
 *
 * Drag-and-drop file upload interface for Obsidian vault import
 * Accepts multiple .md files or folder selection
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, File, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  fileName: string; // Base filename (e.g., "note.md")
  relativePath?: string; // Full relative path from vault root (e.g., "daily/note.md")
  content: string;
  size: number;
  selected: boolean;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  className?: string;
}

export function FileUploadZone({
  onFilesSelected,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setIsProcessing(true);

      const uploadedFiles: UploadedFile[] = [];

      // Process each file
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Only accept .md files
        if (!file.name.toLowerCase().endsWith('.md')) {
          continue;
        }

        try {
          const content = await file.text();

          // Preserve relative path for folder uploads (webkitRelativePath)
          // This is critical for resolving WikiLinks with folder structure (e.g., [[daily/2024-01-01]])
          const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

          uploadedFiles.push({
            fileName: file.name,
            relativePath,
            content,
            size: file.size,
            selected: true, // All files selected by default
          });
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }

      setIsProcessing(false);

      if (uploadedFiles.length > 0) {
        onFilesSelected(uploadedFiles);
      }
    },
    [onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openFolderDialog = () => {
    folderInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory is a non-standard attribute
        webkitdirectory="true"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drag-and-drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'rounded-lg border-2 border-dashed',
          'min-h-[300px] p-8',
          'transition-colors duration-200',
          isDragging
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900',
          isProcessing && 'opacity-50 pointer-events-none'
        )}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing files...
            </p>
          </div>
        ) : (
          <>
            <Upload className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Import Obsidian Vault
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
              Drag and drop your Obsidian folder here, or use the buttons below
              to select files
            </p>

            <div className="flex gap-4">
              <Button onClick={openFolderDialog} variant="default" size="lg">
                <FolderOpen className="h-4 w-4 mr-2" />
                Select Folder
              </Button>

              <Button onClick={openFileDialog} variant="outline" size="lg">
                <File className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
              Only .md (Markdown) files will be imported
            </p>
          </>
        )}
      </div>
    </div>
  );
}
