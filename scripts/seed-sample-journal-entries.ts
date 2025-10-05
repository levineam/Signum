/**
 * Seed script: Load sample journal entries into Supabase
 * Story 2.4: Supabase Migration
 *
 * Usage: source .env.local && npx tsx scripts/seed-sample-journal-entries.ts
 */

import { sampleJournalEntries } from '../src/data/sampleEntries'
import { createClient } from '@supabase/supabase-js'

// Fixed user ID for prototype phase
const PROTOTYPE_USER_ID = '00000000-0000-0000-0000-000000000000'

async function seedSampleJournalEntries() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🌱 Starting sample journal entry seeding...')
  console.log(`   User ID: ${PROTOTYPE_USER_ID}`)
  console.log(`   Entries to seed: ${sampleJournalEntries.length}`)

  // Check if entries already exist
  const { count } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', PROTOTYPE_USER_ID)
    .eq('note_type', 'journal-entry')

  if (count && count > 0) {
    console.log(`\n⚠️  Found ${count} existing journal entries for prototype user`)
    console.log('   Skipping seed to avoid duplicates')
    console.log('   To re-seed, delete existing entries first')
    return
  }

  // Convert sample entries to Supabase note format
  // Note: Don't use entry.id as Supabase will auto-generate UUIDs
  const notesToInsert = sampleJournalEntries.map(entry => ({
    user_id: PROTOTYPE_USER_ID,
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
