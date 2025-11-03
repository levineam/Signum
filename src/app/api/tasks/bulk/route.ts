import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'taskIds array is required' },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch tasks by IDs (RLS will ensure user owns them)
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, due_at, rrule, status, is_query, query_confidence')
      .in('id', taskIds)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('[POST /api/tasks/bulk] Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedTasks = (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      dueAt: task.due_at,
      rrule: task.rrule,
      status: task.status,
      isQuery: task.is_query || false,
      queryConfidence: task.query_confidence || 0
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('[POST /api/tasks/bulk] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
