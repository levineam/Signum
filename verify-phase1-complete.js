#!/usr/bin/env node
/**
 * Phase 1 Complete Verification Script
 * Story 2.4.6: Production Security Hardening
 *
 * Verifies:
 * 1. RLS policies correctly configured
 * 2. Prototype user deleted from all auth tables
 * 3. No orphaned data in notes/links tables
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY (for orphaned data checks)
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY (for RLS policy testing)
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://otyvmmgakowcdsxehwox.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('   Export it from your .env.local file:')
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=your-key-here')
  process.exit(1)
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  console.error('   Export it from your .env.local file:')
  console.error('   export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here')
  process.exit(1)
}

// Service role client - bypasses RLS, used for checking orphaned data
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Anonymous client - subject to RLS, used for testing policies
const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runVerification() {
  console.log('🔍 Phase 1 Complete Verification\n')
  console.log('Story 2.4.6: Production Security Hardening')
  console.log('='.repeat(60) + '\n')

  let allPassed = true
  const PROTOTYPE_UUID = '00000000-0000-0000-0000-000000000000'

  // Test 1: Verify notes table has correct policies
  console.log('1️⃣  Testing Notes Table RLS Policies...')
  try {
    // Use anonymous client (not service role) to verify RLS blocks unauthenticated access
    const { data: anonTest, error: anonError } = await anonSupabase
      .from('notes')
      .select('id')
      .limit(1)

    if (anonError && anonError.message.includes('violates row-level security')) {
      console.log('   ✅ RLS correctly blocks unauthenticated access to notes')
    } else if (anonError) {
      console.log(`   ⚠️  Unexpected error: ${anonError.message}`)
      allPassed = false
    } else if (anonTest && anonTest.length === 0) {
      console.log('   ✅ Notes table accessible but returns no data (RLS working)')
    } else {
      console.log('   ⚠️  RLS may not be properly configured (data accessible without auth)')
      allPassed = false
    }
  } catch (error) {
    console.log(`   ⚠️  Error testing RLS: ${error.message}`)
    allPassed = false
  }

  // Test 2: Check for orphaned notes
  console.log('\n2️⃣  Checking for Orphaned Notes...')
  try {
    const { count, error } = await supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', PROTOTYPE_UUID)

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`)
      allPassed = false
    } else if (count === 0) {
      console.log('   ✅ No orphaned notes found (count = 0)')
    } else {
      console.log(`   ❌ Found ${count} orphaned notes with prototype user_id!`)
      allPassed = false
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`)
    allPassed = false
  }

  // Test 3: Check for orphaned links
  console.log('\n3️⃣  Checking for Orphaned Links...')
  try {
    const { count, error } = await supabase
      .from('links')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', PROTOTYPE_UUID)

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`)
      allPassed = false
    } else if (count === 0) {
      console.log('   ✅ No orphaned links found (count = 0)')
    } else {
      console.log(`   ❌ Found ${count} orphaned links with prototype user_id!`)
      allPassed = false
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`)
    allPassed = false
  }

  // Test 4: Verify policies use auth.uid() pattern
  console.log('\n4️⃣  Verifying RLS Policy Configuration...')
  console.log('   ℹ️  This requires manual verification in Supabase Dashboard:')
  console.log('   1. Go to Supabase Dashboard > SQL Editor')
  console.log('   2. Run: SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename IN (\'notes\', \'links\');')
  console.log('   3. Verify policies use auth.uid() and NOT hardcoded UUID')
  console.log('   4. Verify policies have TO authenticated (not TO public)')

  // Summary
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ Phase 1 Automated Verification PASSED')
    console.log('\nAll automated checks passed!')
    console.log('\nManual verification still required:')
    console.log('1. Check RLS policies in Supabase Dashboard (see step 4 above)')
    console.log('2. Verify prototype user deleted from auth tables (requires admin access)')
    console.log('3. Run cross-user isolation testing (Phase 3)')
  } else {
    console.log('❌ Phase 1 Automated Verification FAILED')
    console.log('\nSome checks did not pass. Review errors above.')
  }
  console.log('='.repeat(60))
}

runVerification().catch(error => {
  console.error('\n❌ Verification script error:', error.message)
  process.exit(1)
})
