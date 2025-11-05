import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Edge runtime for longer timeout (25s+) vs Node.js runtime (10s on Hobby tier)
export const runtime = 'edge';

const RESEARCH_ANSWER_SYSTEM_PROMPT = `You are a research assistant helping users answer questions from their personal journals.

Guidelines:
- Provide concise, accurate answers (200-500 words for simple questions, up to 1000 for complex)
- Use markdown formatting (headings, lists, bold, italics) for clarity
- Use citation-style phrasing when appropriate (e.g., "According to recent research..." or "Studies show...")
- Note: Without retrieval, focus on authoritative language patterns rather than verifiable citations
- Acknowledge uncertainty when appropriate (e.g., "This is debated..." or "Evidence suggests...")
- Avoid speculation or hallucination - stick to well-established facts
- Be conversational but informative

Format your response using markdown:
- Use **bold** for key terms
- Use bullet points or numbered lists for clarity
- Use headings (##) to organize longer answers
- Use > blockquotes for citations when appropriate

Example good answer:
## What is Wheeler's "It from Bit" concept?

"It from bit" is a philosophical concept proposed by physicist **John Archibald Wheeler** in the 1980s. The idea suggests that:

- **Information is fundamental**: Physical reality ("it") emerges from binary choices and measurements ("bit")
- **Observer participation**: The universe is participatory - observation and measurement create reality
- **Quantum foundation**: Draws from quantum mechanics, where observation collapses possibilities into actualities

According to Wheeler, "every physical quantity, every it, derives its ultimate significance from bits, binary yes-or-no indications." This connects information theory with quantum physics.

The concept has influenced modern physics, particularly in quantum information theory and the holographic principle.`;

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (anon key + Bearer token pattern, RLS-safe)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[AI Answer] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error', code: 'SERVER_CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const { taskId, taskText } = body;

    if (!taskId || !taskText) {
      return NextResponse.json(
        { error: 'Missing required fields (taskId, taskText)', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Validate taskText length
    if (typeof taskText !== 'string' || taskText.length > 500) {
      return NextResponse.json(
        { error: 'Task text must be a string with max 500 characters', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 3. Verify task belongs to user (RLS enforced)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, user_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('[AI Answer] Task not found or access denied:', taskError);
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Check for OpenAI API key and initialize client
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI Answer] Missing OpenAI API key');
      return NextResponse.json(
        { error: 'AI service not configured', code: 'AI_SERVICE_ERROR' },
        { status: 500 }
      );
    }

    // Log API key presence (not the actual key)
    console.log('[AI Answer] OpenAI API key present:', !!process.env.OPENAI_API_KEY);
    console.log('[AI Answer] OpenAI API key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7));

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 25000, // 25 seconds - balance between user experience and serverless limits
      maxRetries: 1, // Single retry for transient network issues
    });

    // 5. Generate AI answer
    console.log('[AI Answer] Calling OpenAI API...');
    const startTime = Date.now();

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-efficient model
        messages: [
          {
            role: 'system',
            content: RESEARCH_ANSWER_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: taskText
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const duration = Date.now() - startTime;
      console.log(`[AI Answer] OpenAI API call completed in ${duration}ms`);

      const answer = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // 6. Create note with AI-generated answer (Story 1.9.4)
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: taskText.length > 100 ? taskText.substring(0, 97) + '...' : taskText,
          content: answer,
          note_type: 'custom',
          is_pinned: false,
          metadata: {
            sourceType: 'ai-answer',
            taskId,
            taskText,
            tokensUsed,
            model: 'gpt-4o-mini',
            generatedAt: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (noteError) {
        console.error('[AI Answer] Failed to create note:', noteError);
        // Don't fail the request - we got the answer, just couldn't save it
        return NextResponse.json({
          answer,
          taskId,
          noteId: null,
          tokensUsed,
          warning: 'Answer generated but failed to save as note'
        });
      }

      // 7. Log usage for cost tracking
      console.log('[AI Answer] Request completed', {
        userId: user.id,
        taskId,
        noteId: note.id,
        tokensUsed,
        answerLength: answer.length,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        answer,
        taskId,
        noteId: note.id,
        tokensUsed
      });

    } catch (error: unknown) {
      // Handle timeout errors from OpenAI SDK
      if (error && typeof error === 'object' && 'name' in error && error.name === 'APIConnectionTimeoutError') {
        return NextResponse.json(
          { error: 'Request timeout - AI took too long to respond', code: 'TIMEOUT' },
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
        return NextResponse.json(
          { error: 'OpenAI rate limit reached. Please try again later.', code: 'OPENAI_RATE_LIMIT' },
          { status: 429 }
        );
      }
    }

    // Generic error with details in development
    const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
    return NextResponse.json(
      {
        error: 'Failed to generate AI answer. Please try again.',
        code: 'INTERNAL_ERROR',
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    );
  }
}
