/**
 * Task parsing API endpoint
 * Story 1.2: Natural Language Task/Reminder Parsing
 *
 * POST /api/tasks/parse
 * Parses natural language text to extract and create tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectTask } from '@/utils/nlp/taskDetection';

export async function POST(req: NextRequest) {
  try {
    // Check environment variables at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { paragraphText, userId, entryId } = body;

    // Validate inputs
    if (!paragraphText || typeof paragraphText !== 'string') {
      return NextResponse.json(
        { error: 'paragraphText is required and must be a string' },
        { status: 400 }
      );
    }

    if (paragraphText.length > 1000) {
      return NextResponse.json(
        { error: 'paragraphText must be less than 1000 characters' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    // Authenticate user via authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create authenticated Supabase client using anon key + user JWT
    // This respects RLS policies with the user's session
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid user token' },
        { status: 401 }
      );
    }

    // Detect task in paragraph
    const detectedTask = detectTask(paragraphText);

    // No task detected
    if (!detectedTask) {
      return NextResponse.json({ task: null });
    }

    // Create task in database using the authenticated supabase client
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: detectedTask.title,
        due_at: detectedTask.dueAt?.toISOString() || null,
        metadata: {
          source_entry_id: entryId,
          rrule: detectedTask.rrule,
          extracted_from_text: paragraphText
        }
      })
      .select()
      .single();

    if (taskError || !task) {
      console.error('Error creating task:', taskError);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // Create reminder if due date exists
    if (detectedTask.dueAt) {
      const { error: reminderError } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          task_id: task.id,
          rule_type: detectedTask.rrule ? 'rrule' : 'oneoff',
          rrule: detectedTask.rrule || null
        });

      if (reminderError) {
        console.error('Error creating reminder:', reminderError);
        // Don't fail the entire request if reminder creation fails
      }
    }

    // Return created task
    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        dueAt: task.due_at,
        rrule: detectedTask.rrule || null,
        status: task.status
      }
    });

  } catch (error) {
    console.error('Error parsing task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
