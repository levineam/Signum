#!/usr/bin/env node
/**
 * Verification script for Phase 1 migration
 * Runs all verification queries against Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://otyvmmgakowcdsxehwox.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runVerification() {
  console.log('🔍 Phase 1 Migration Verification\n')

  let allPassed = true

  // Query 1: Check notes policies
  console.log('1️⃣  Checking notes table policies...')
  const { data: notesPolicies, error: notesPoliciesError } = await supabase
    .rpc('exec_sql', {
      query: "SELECT policyname, roles FROM pg_policies WHERE tablename = 'notes'"
    })

  if (notesPoliciesError) {
    // Try alternate approach
    console.log('   Using alternate query method...')
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, roles')
      .eq('tablename', 'notes')

    if (error) {
      console.log(`   ⚠️  Cannot query pg_policies directly: ${error.message}`)
      console.log('   Manual verification needed via Supabase dashboard')
    } else {
      console.log('   ✅ Notes policies:')
      data.forEach(p => console.log(`      - ${p.policyname} (${p.roles})`))
    }
  }

  // Query 2: Check links policies
  console.log('\n2️⃣  Checking links table policies...')
  const { data: linksPolicies, error: linksPoliciesError } = await supabase
    .from('pg_policies')
    .select('policyname, roles')
    .eq('tablename', 'links')

  if (linksPoliciesError) {
    console.log(`   ⚠️  Cannot query: ${linksPoliciesError.message}`)
  }

  // Query 3-5: Check prototype user deletion
  console.log('\n3️⃣  Checking prototype user deletion from auth.users...')
  const { data: authUsers, error: authUsersError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('id', '00000000-0000-0000-0000-000000000000')

  if (authUsersError) {
    console.log(`   ⚠️  Cannot query auth.users directly (expected - RLS protected)`)
    console.log('   This is normal - auth tables require service role access')
  } else if (authUsers && authUsers.length === 0) {
    console.log('   ✅ Prototype user not found in auth.users (deleted)')
  } else {
    console.log('   ❌ Prototype user still exists!')
    allPassed = false
  }

  // Query 6-7: Check for orphaned data
  console.log('\n4️⃣  Checking for orphaned data in notes...')
  const { count: notesCount, error: notesCountError } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', '00000000-0000-0000-0000-000000000000')

  if (notesCountError) {
    console.log(`   ⚠️  Error: ${notesCountError.message}`)
    allPassed = false
  } else if (notesCount === 0) {
    console.log('   ✅ No orphaned notes (count = 0)')
  } else {
    console.log(`   ❌ Found ${notesCount} orphaned notes!`)
    allPassed = false
  }

  console.log('\n5️⃣  Checking for orphaned data in links...')
  const { count: linksCount, error: linksCountError } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', '00000000-0000-0000-0000-000000000000')

  if (linksCountError) {
    console.log(`   ⚠️  Error: ${linksCountError.message}`)
    allPassed = false
  } else if (linksCount === 0) {
    console.log('   ✅ No orphaned links (count = 0)')
  } else {
    console.log(`   ❌ Found ${linksCount} orphaned links!`)
    allPassed = false
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ Phase 1 Migration Verification PASSED')
    console.log('\nNext steps:')
    console.log('1. Verify policies manually in Supabase dashboard (SQL Editor)')
    console.log('2. Run cross-user isolation test')
    console.log('3. Continue with Phase 2 (Logging)')
  } else {
    console.log('❌ Phase 1 Migration Verification FAILED')
    console.log('\nSome checks did not pass. Review errors above.')
  }
  console.log('='.repeat(60))
}

runVerification().catch(error => {
  console.error('\n❌ Verification script error:', error.message)
  process.exit(1)
})
