/**
 * Seed script: Load sample journal entries into Supabase
 * Story 2.4.6: Updated to require authenticated user ID
 *
 * ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
 * This script requires a valid user ID from Supabase Auth.
 *
 * Usage:
 *   # Set USER_ID environment variable to authenticated user's UUID
 *   source .env.local && USER_ID="your-user-uuid" npx tsx scripts/seed-sample-journal-entries.ts
 *
 *   # Or pass as argument
 *   source .env.local && npx tsx scripts/seed-sample-journal-entries.ts your-user-uuid
 *
 * To get your user ID:
 *   1. Sign up/login to the app
 *   2. Open browser console
 *   3. Run: supabase.auth.getUser().then(r => console.log(r.data.user.id))
 */

import { sampleJournalEntries } from '../src/data/sampleEntries'
import { createClient } from '@supabase/supabase-js'

// Get user ID from environment variable or command-line argument
const USER_ID = process.argv[2] || process.env.USER_ID

if (!USER_ID) {
  console.error('❌ Missing USER_ID')
  console.error('\nUsage:')
  console.error('  USER_ID="your-uuid" npx tsx scripts/seed-sample-journal-entries.ts')
  console.error('  OR')
  console.error('  npx tsx scripts/seed-sample-journal-entries.ts your-uuid')
  console.error('\nGet your user ID from the app (see instructions in file header)')
  process.exit(1)
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(USER_ID)) {
  console.error('❌ Invalid UUID format:', USER_ID)
  console.error('   Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
  process.exit(1)
}

async function seedSampleJournalEntries() {
  // Initialize Supabase client with service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
    console.error('\n⚠️  Note: SUPABASE_SERVICE_ROLE_KEY is required for seeding')
    console.error('   Get it from: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox/settings/api')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false // Prevent session caching on server
    }
  })

  console.log('🌱 Starting sample journal entry seeding...')
  console.log(`   User ID: ${USER_ID}`)
  console.log(`   Entries to seed: ${sampleJournalEntries.length}`)

  // Check if entries already exist
  const { count } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('note_type', 'journal-entry')

  if (count && count > 0) {
    console.log(`\n⚠️  Found ${count} existing journal entries for this user`)
    console.log('   Skipping seed to avoid duplicates')
    console.log('   To re-seed, delete existing entries first')
    return
  }

  // Convert sample entries to Supabase note format
  // Note: Don't use entry.id as Supabase will auto-generate UUIDs
  const notesToInsert = sampleJournalEntries.map(entry => ({
    user_id: USER_ID,
    title: `Journal Entry - ${entry.date}`,
    content: entry.content,
    note_type: 'journal-entry',
    is_pinned: false,
    metadata: {
      journalDate: entry.date,
      isSample: entry.isSample,
      originalId: entry.id // Preserve original ID in metadata for reference
    },
    created_at: entry.lastModified,
    updated_at: entry.lastModified
  }))

  // Insert in batches (Supabase handles up to 1000 per insert)
  const BATCH_SIZE = 100
  let inserted = 0

  for (let i = 0; i < notesToInsert.length; i += BATCH_SIZE) {
    const batch = notesToInsert.slice(i, i + BATCH_SIZE)

    const { data, error } = await supabase
      .from('notes')
      .insert(batch)
      .select()

    if (error) {
      console.error(`\n❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error)
      process.exit(1)
    }

    inserted += data.length
    console.log(`   ✓ Inserted batch ${i / BATCH_SIZE + 1}: ${data.length} entries`)
  }

  console.log(`\n✅ Successfully seeded ${inserted} sample journal entries`)
  console.log(`   You can now test ontology extraction with real Supabase data`)
}

// Run the seed script
seedSampleJournalEntries()
  .then(() => {
    console.log('\n🎉 Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })
