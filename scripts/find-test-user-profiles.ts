/**
 * Find Test User Profiles Script
 *
 * This script finds profiles with specific test email patterns
 *
 * Usage:
 *   npx tsx scripts/find-test-user-profiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create service client directly
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const TEST_PROFILE_NAMES = [
  'John Smith',
  'Jane Doe',
  'Bob Johnson',
  'Alice Williams',
  'Global Travel Agency',
  'Destination Management Co',
  'Premium Transport Services',
];

async function findTestUserProfiles() {
  console.log('🔍 Searching for test user profiles...\n');

  // Get all profiles
  const { data: profiles, error: profilesError } = await serviceClient
    .from('profiles')
    .select('id, full_name, role, application_status, created_at');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  console.log(`Total profiles in database: ${profiles.length}\n`);

  // Get all auth users
  const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    process.exit(1);
  }

  // Create a map of auth users
  const authUsersMap = new Map(authUsers.users.map(u => [u.id, u]));

  console.log('All Profiles:\n');
  profiles.forEach(profile => {
    const authUser = authUsersMap.get(profile.id);
    const email = authUser?.email || '(NO AUTH USER)';
    const isOrphaned = !authUser ? ' ⚠️ ORPHANED' : '';

    console.log(`  - ${profile.full_name} (${profile.role})`);
    console.log(`    Email: ${email}${isOrphaned}`);
    console.log(`    ID: ${profile.id}`);
    console.log(`    Status: ${profile.application_status}`);
    console.log(`    Created: ${new Date(profile.created_at).toLocaleString()}\n`);
  });

  // Check for profiles matching test names
  const testProfiles = profiles.filter(p =>
    TEST_PROFILE_NAMES.includes(p.full_name)
  );

  if (testProfiles.length > 0) {
    console.log('\n📋 Test profiles found:\n');
    testProfiles.forEach(profile => {
      const authUser = authUsersMap.get(profile.id);
      console.log(`  - ${profile.full_name}: ${authUser?.email || 'NO AUTH USER'}`);
    });
  }
}

// Run the search
findTestUserProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
