/**
 * Cleanup Test Users Script
 *
 * This script removes test users that were created during bulk upload testing.
 * It properly deletes auth users, profiles, guides, and agencies in the correct order.
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-users.ts
 */

import { getSupabaseServiceClient } from '../lib/supabase/service';

const TEST_EMAILS = [
  'test@example.com',
  'test2@hotmail.com',
  'test3@gmail.com',
  'test4@outlook.com',
  'contact@travelagency.com',
  'contact@dmccompany.com',
  'contact@transportco.com',
];

async function cleanupTestUsers() {
  const serviceClient = getSupabaseServiceClient();

  console.log('🔍 Finding test users...\n');

  // Get all auth users
  const { data: authUsers, error: listError } = await serviceClient.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  // Find test users
  const testUsers = authUsers.users.filter(user =>
    TEST_EMAILS.includes(user.email || '')
  );

  if (testUsers.length === 0) {
    console.log('✅ No test users found. Database is clean!');
    return;
  }

  console.log(`Found ${testUsers.length} test user(s):`);
  testUsers.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`);
  });
  console.log();

  // Delete each test user completely
  for (const user of testUsers) {
    console.log(`🗑️  Deleting user: ${user.email}`);

    try {
      // Step 1: Delete guide records (if any)
      const { error: guideError } = await serviceClient
        .from('guides')
        .delete()
        .eq('profile_id', user.id);

      if (guideError && guideError.code !== 'PGRST116') { // Ignore "not found" errors
        console.log(`   ⚠️  Error deleting guide: ${guideError.message}`);
      } else {
        console.log(`   ✓ Guide record deleted (if existed)`);
      }

      // Step 2: Delete agency records (if any)
      const { error: agencyError } = await serviceClient
        .from('agencies')
        .delete()
        .eq('id', user.id);

      if (agencyError && agencyError.code !== 'PGRST116') {
        console.log(`   ⚠️  Error deleting agency: ${agencyError.message}`);
      } else {
        console.log(`   ✓ Agency record deleted (if existed)`);
      }

      // Step 3: Delete profile
      const { error: profileError } = await serviceClient
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError && profileError.code !== 'PGRST116') {
        console.log(`   ⚠️  Error deleting profile: ${profileError.message}`);
      } else {
        console.log(`   ✓ Profile deleted`);
      }

      // Step 4: Delete auth user (this is the most important step)
      const { error: authError } = await serviceClient.auth.admin.deleteUser(user.id);

      if (authError) {
        console.log(`   ❌ Error deleting auth user: ${authError.message}`);
      } else {
        console.log(`   ✓ Auth user deleted`);
      }

      console.log(`   ✅ ${user.email} cleanup complete\n`);
    } catch (error) {
      console.error(`   ❌ Unexpected error:`, error);
    }
  }

  console.log('🎉 All test users have been cleaned up!');
  console.log('📝 You can now retry the bulk upload.');
}

// Run the cleanup
cleanupTestUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
