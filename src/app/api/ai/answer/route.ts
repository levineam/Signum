import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { convertMarkdownToHtml } from '@/lib/ai/markdown-to-html';
import { JOURNAL_QUERY_SYSTEM_PROMPT, RESEARCH_ANSWER_SYSTEM_PROMPT } from '@/lib/ai/prompt-templates';
import type {
  AIAnswerRequest,
  AIAnswerResponse,
  AIAnswerErrorResponse,
  AIAnswerErrorCode,
  AIAnswerNoteMetadata,
} from '@/lib/ai/types';

// Edge runtime for longer timeout (25s+) vs Node.js runtime (10s on Hobby tier)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (anon key + Bearer token pattern, RLS-safe)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' as AIAnswerErrorCode },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[AI Answer] Missing Supabase environment variables');
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Server configuration error', code: 'SERVER_CONFIG_ERROR' as AIAnswerErrorCode },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' as AIAnswerErrorCode },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body: AIAnswerRequest = await request.json();
    const { taskId, entryId, sourceType, query, selectedText } = body;

    if (!sourceType || !query) {
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Missing required fields (sourceType, query)', code: 'INVALID_REQUEST' as AIAnswerErrorCode },
        { status: 400 }
      );
    }

    // Validate sourceType
    if (sourceType !== 'task' && sourceType !== 'journal') {
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Invalid sourceType. Must be "task" or "journal"', code: 'INVALID_REQUEST' as AIAnswerErrorCode },
        { status: 400 }
      );
    }

    // Validate query length
    if (typeof query !== 'string' || query.length > 500) {
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'Query must be a string with max 500 characters', code: 'INVALID_INPUT' as AIAnswerErrorCode },
        { status: 400 }
      );
    }

    // 3. Source-specific validation
    if (sourceType === 'task') {
      // Task source: Verify task belongs to user (RLS enforced)
      if (!taskId) {
        return NextResponse.json<AIAnswerErrorResponse>(
          { error: 'taskId required when sourceType is "task"', code: 'INVALID_REQUEST' as AIAnswerErrorCode },
          { status: 400 }
        );
      }

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, title, user_id')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        console.error('[AI Answer] Task not found or access denied:', taskError);
        return NextResponse.json<AIAnswerErrorResponse>(
          { error: 'Task not found', code: 'TASK_NOT_FOUND' as AIAnswerErrorCode },
          { status: 404 }
        );
      }
    } else if (sourceType === 'journal') {
      // Journal source: Optional entry ID validation
      // Note: We don't strictly require entryId since user might be asking about selected text without a specific entry
      if (entryId) {
        // If provided, verify it exists and belongs to user. Journal entries live in the unified notes table.
        const { data: entry, error: entryError } = await supabase
          .from('notes')
          .select('id, user_id, note_type')
          .eq('id', entryId)
          .single();

        if (entryError || !entry) {
          console.error('[AI Answer] Journal entry not found or access denied:', entryError);
          return NextResponse.json<AIAnswerErrorResponse>(
            { error: 'Journal entry not found', code: 'ENTRY_NOT_FOUND' as AIAnswerErrorCode },
            { status: 404 }
          );
        }

        if (entry.user_id !== user.id || entry.note_type !== 'journal-entry') {
          console.error('[AI Answer] Entry exists but is not a journal entry or belongs to another user');
          return NextResponse.json<AIAnswerErrorResponse>(
            { error: 'Journal entry not found', code: 'ENTRY_NOT_FOUND' as AIAnswerErrorCode },
            { status: 404 }
          );
        }
      }
    }

    // 4. Check for OpenAI API key and initialize client
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI Answer] Missing OpenAI API key');
      return NextResponse.json<AIAnswerErrorResponse>(
        { error: 'AI service not configured', code: 'AI_SERVICE_ERROR' as AIAnswerErrorCode },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20000, // 20 seconds - stay within edge function 30s limit with overhead
      maxRetries: 0, // No retries to prevent exceeding 30s edge function timeout
    });

    // 5. Select appropriate system prompt based on source type
    const systemPrompt = sourceType === 'journal'
      ? JOURNAL_QUERY_SYSTEM_PROMPT
      : RESEARCH_ANSWER_SYSTEM_PROMPT;

    // 6. Generate AI answer
    console.log('[AI Answer] Calling OpenAI API...', {
      sourceType,
      queryLength: query.length,
      hasSelectedText: !!selectedText,
    });
    const startTime = Date.now();

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-efficient model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: selectedText
              ? `Selected text: "${selectedText}"\n\nQuestion: ${query}`
              : query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const duration = Date.now() - startTime;
      console.log(`[AI Answer] OpenAI API call completed in ${duration}ms`);

      const markdownAnswer = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // 7. Convert markdown to HTML (CRITICAL: fixes PR #141 rendering issue)
      console.log('[AI Answer] Converting markdown to HTML...');
      const htmlAnswer = await convertMarkdownToHtml(markdownAnswer);

      // 8. Create note with AI-generated answer
      const noteTitle = query.length > 100 ? query.substring(0, 97) + '...' : query;

      // Build metadata object based on source type
      const metadata: AIAnswerNoteMetadata = {
        sourceType,
        query,
        tokensUsed,
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        ...(sourceType === 'task' && taskId && {
          taskId,
          taskText: query, // For task sources, query is often the task text
        }),
        ...(sourceType === 'journal' && {
          ...(entryId && { journalEntryId: entryId }),
          ...(selectedText && { selectedText }),
        }),
      };

      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle,
          content: htmlAnswer, // Store as HTML, not markdown
          note_type: 'custom',
          is_pinned: false,
          metadata,
        })
        .select('id')
        .single();

      if (noteError) {
        console.error('[AI Answer] Failed to create note:', noteError);
        // Don't fail the request - we got the answer, just couldn't save it
        return NextResponse.json<AIAnswerResponse>({
          answer: htmlAnswer,
          noteId: '',
          tokensUsed,
          model: 'gpt-4o-mini',
          warning: 'Answer generated but failed to save as note'
        });
      }

      // 9. Log usage for cost tracking
      console.log('[AI Answer] Request completed', {
        userId: user.id,
        sourceType,
        taskId,
        entryId,
        noteId: note.id,
        tokensUsed,
        answerLength: htmlAnswer.length,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json<AIAnswerResponse>({
        answer: htmlAnswer,
        noteId: note.id,
        tokensUsed,
        model: 'gpt-4o-mini',
      });

    } catch (error: unknown) {
      // Handle timeout errors from OpenAI SDK
      if (error && typeof error === 'object' && 'name' in error && error.name === 'APIConnectionTimeoutError') {
        return NextResponse.json<AIAnswerErrorResponse>(
          { error: 'Request timeout - AI took too long to respond', code: 'TIMEOUT' as AIAnswerErrorCode },
          { status: 408 }
        );
      }

      // Re-throw for outer catch block to handle
      throw error;
    }

  } catch (error: unknown) {
    // Detailed error logging
    console.error('[AI Answer] Error occurred:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    // Handle OpenAI-specific errors
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = error as { response?: { status?: number } };
      if (errorResponse.response?.status === 429) {
        return NextResponse.json<AIAnswerErrorResponse>(
          { error: 'OpenAI rate limit reached. Please try again later.', code: 'OPENAI_RATE_LIMIT' as AIAnswerErrorCode },
          { status: 429 }
        );
      }
    }

    // Generic error with details in development
    const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
    return NextResponse.json<AIAnswerErrorResponse>(
      {
        error: 'Failed to generate AI answer. Please try again.',
        code: 'INTERNAL_ERROR' as AIAnswerErrorCode,
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    );
  }
}
