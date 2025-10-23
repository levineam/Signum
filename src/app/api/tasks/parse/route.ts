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
    const { paragraphText, userId, entryId, timezoneOffset, timezone } = body;

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

    if (timezoneOffset !== undefined && typeof timezoneOffset !== 'number') {
      return NextResponse.json(
        { error: 'timezoneOffset must be a number (minutes)' },
        { status: 400 }
      );
    }

    if (timezone !== undefined && typeof timezone !== 'string') {
      return NextResponse.json(
        { error: 'timezone must be a string (e.g., "America/New_York")' },
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

    // Detect task in paragraph (pass timezone info for DST-aware date parsing)
    const detectedTask = detectTask(paragraphText, timezoneOffset, timezone);

    // No task detected
    if (!detectedTask) {
      return NextResponse.json({ task: null });
    }

    // Check if a task already exists for this paragraph to prevent duplicates on reload
    // Query tasks where metadata contains the exact paragraph text and entry ID
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id, title, due_at, status, metadata')
      .eq('user_id', userId)
      .contains('metadata', {
        source_entry_id: entryId,
        extracted_from_text: paragraphText
      })
      .limit(1);

    // If task already exists, return it instead of creating a duplicate
    if (existingTasks && existingTasks.length > 0) {
      const existingTask = existingTasks[0];
      console.log('[Task Parse API] Task already exists for this paragraph, skipping creation:', existingTask.id);
      return NextResponse.json({
        task: {
          id: existingTask.id,
          title: existingTask.title,
          dueAt: existingTask.due_at,
          rrule: existingTask.metadata?.rrule || null,
          status: existingTask.status,
          alreadyExisted: true
        }
      });
    }

    // Create task in database using the authenticated supabase client
    // Store both timezone ID and offset for proper DST handling in future occurrences
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: detectedTask.title,
        due_at: detectedTask.dueAt?.toISOString() || null,
        metadata: {
          source_entry_id: entryId,
          rrule: detectedTask.rrule,
          extracted_from_text: paragraphText,
          timezone_offset_at_creation: timezoneOffset, // Offset in minutes
          timezone: timezone || null // IANA timezone ID (e.g., "America/New_York") for DST handling
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
