/**
 * Shared TypeScript types for AI features
 */

/**
 * Source type for AI queries
 */
export type AIQuerySourceType = 'task' | 'journal'

/**
 * Request body for /api/ai/answer endpoint
 */
export interface AIAnswerRequest {
  /** ID of the task (optional, for task sources) */
  taskId?: string
  /** ID of the journal entry (optional, for journal sources) */
  entryId?: string
  /** Source type of the query */
  sourceType: AIQuerySourceType
  /** The user's refined question/query */
  query: string
  /** Original selected text for context (optional) */
  selectedText?: string
}

/**
 * Response from /api/ai/answer endpoint
 */
export interface AIAnswerResponse {
  /** The AI-generated answer (HTML format) */
  answer: string
  /** ID of the created note (empty string if client-side creation pending) */
  noteId: string
  /** Suggested title for the note */
  title?: string
  /** Metadata to store with the note */
  metadata?: AIAnswerNoteMetadata
  /** Number of tokens used in the API call */
  tokensUsed: number
  /** Model used for generation */
  model: string
  /** Warning message (optional, if note creation failed) */
  warning?: string
}

/**
 * Metadata stored in note.metadata JSONB field for AI-generated notes
 */
export interface AIAnswerNoteMetadata {
  /** Source type ('task' | 'journal') */
  sourceType: AIQuerySourceType
  /** ID of source task (if sourceType === 'task') */
  taskId?: string
  /** Text of the task (if sourceType === 'task') */
  taskText?: string
  /** ID of source journal entry (if sourceType === 'journal') */
  journalEntryId?: string
  /** Original selected text from journal (if sourceType === 'journal') */
  selectedText?: string
  /** User's refined query/question */
  query: string
  /** Number of tokens used */
  tokensUsed: number
  /** Model used for generation */
  model: string
  /** Timestamp when answer was generated */
  generatedAt: string
}

/**
 * Error codes for AI answer generation
 */
export enum AIAnswerErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_INPUT = 'INVALID_INPUT',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  ENTRY_NOT_FOUND = 'ENTRY_NOT_FOUND',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVER_CONFIG_ERROR = 'SERVER_CONFIG_ERROR',
}

/**
 * Error response from /api/ai/answer endpoint
 */
export interface AIAnswerErrorResponse {
  /** User-friendly error message */
  error: string
  /** Error code for programmatic handling */
  code: AIAnswerErrorCode
  /** Additional error details (dev/preview only) */
  details?: string
}

/**
 * Metadata stored in note.metadata JSONB field for video summary notes
 */
export interface VideoSummaryNoteMetadata {
  /** Source type identifier */
  sourceType: 'video'
  /** YouTube video ID */
  videoId: string
  /** Original YouTube URL */
  videoUrl: string
  /** Video title (if available) */
  videoTitle?: string
  /** ID of source journal entry (if summarized from a journal) */
  journalEntryId?: string
  /** Number of tokens used */
  tokensUsed: number
  /** Model used for generation */
  model: string
  /** Timestamp when summary was generated */
  generatedAt: string
}

/**
 * Request body for /api/youtube/summarize endpoint
 */
export interface VideoSummarizeRequest {
  /** YouTube video ID */
  videoId: string
  /** Original YouTube URL (for reference) */
  videoUrl?: string
  /** ID of journal entry to link the summary to */
  entryId?: string
}

/**
 * Response from /api/youtube/summarize endpoint
 */
export interface VideoSummarizeResponse {
  /** ID of the created summary note */
  noteId: string
  /** The AI-generated summary (HTML format) */
  summary: string
  /** Number of tokens used */
  tokensUsed: number
  /** Model used for generation */
  model: string
  /** Video title (if available) */
  videoTitle?: string
}
