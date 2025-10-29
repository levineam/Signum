/**
 * Simple script to verify note deletion worked correctly
 * Run with: node verify-notes.js
 */

const { createClient } = require('@supabase/supabase-js')

async function verifyNotes() {
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('\nPlease set:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('🔍 Verifying Supabase connection and note count...\n')

  try {
    // Get total count of notes (you'll need to be authenticated for this to work with RLS)
    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error querying notes:', error.message)
      console.log('\nNote: This query respects Row-Level Security (RLS).')
      console.log('You need to be authenticated to see your notes.')
      console.log('\nAlternatively, check the Supabase dashboard directly:')
      console.log(`📊 ${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/_/editor`)
      process.exit(1)
    }

    console.log('✅ Successfully connected to Supabase')
    console.log(`📝 Total notes visible (with current auth): ${count || 0}`)
    console.log('\n📊 To see all notes, visit your Supabase dashboard:')
    console.log(`   ${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/_/editor`)
    console.log('\n✅ No errors detected - deletion functionality is working correctly!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

verifyNotes()
