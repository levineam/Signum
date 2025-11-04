/**
 * Batch processing script to detect queries in existing tasks
 * Story 1.9.1: Query Detection (Rules) for Query-Based Tasks
 *
 * Run with: npx tsx scripts/detect-query-tasks.ts
 *
 * This script:
 * 1. Fetches all existing tasks from the database
 * 2. Runs query detection on each task's title
 * 3. Updates is_query and query_confidence fields
 */

import { createClient } from '@supabase/supabase-js';
import { detectQuery } from '../src/utils/nlp/queryDetection';

// Ensure environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Task {
  id: string;
  title: string;
  is_query: boolean | null;
  query_confidence: number | null;
}

async function main() {
  console.log('🔍 Starting batch query detection for existing tasks...\n');

  // Fetch all tasks
  console.log('Fetching tasks from database...');
  const { data: tasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id, title, is_query, query_confidence')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching tasks:', fetchError);
    process.exit(1);
  }

  if (!tasks || tasks.length === 0) {
    console.log('No tasks found in database.');
    return;
  }

  console.log(`Found ${tasks.length} tasks\n`);

  // Process tasks in batches
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const task of tasks) {
    try {
      // Detect query
      const detection = detectQuery(task.title);

      // Update task in database
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          is_query: detection.isQuery,
          query_confidence: detection.confidence
        })
        .eq('id', task.id);

      if (updateError) {
        console.error(`❌ Error updating task ${task.id}:`, updateError.message);
        errors++;
        continue;
      }

      // Log if classification changed or is new
      const changed = task.is_query !== detection.isQuery;
      if (changed || task.is_query === null) {
        const status = detection.isQuery ? '🔍 QUERY' : '✅ ACTION';
        console.log(`${status} | ${task.title.substring(0, 60)}... (confidence: ${detection.confidence.toFixed(2)})`);
        updated++;
      } else {
        skipped++;
      }

    } catch (err) {
      console.error(`❌ Exception processing task ${task.id}:`, err);
      errors++;
    }
  }

  // Summary
  console.log('\n📊 Batch Processing Summary');
  console.log('─'.repeat(40));
  console.log(`Total tasks processed: ${tasks.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (unchanged): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\n✅ Batch processing complete!');
}

// Run script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
