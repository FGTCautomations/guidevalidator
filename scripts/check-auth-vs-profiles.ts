/**
 * Check Auth Users vs Profiles
 *
 * This script compares auth users with profiles to find mismatches
 *
 * Usage:
 *   npx tsx scripts/check-auth-vs-profiles.ts
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

async function checkAuthVsProfiles() {
  console.log('🔍 Checking auth users vs profiles...\n');

  // Get all auth users
  const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    process.exit(1);
  }

  const authUsers = authData.users;
  console.log(`Total auth users: ${authUsers.length}\n`);

  // Get all profiles
  const { data: profiles, error: profilesError } = await serviceClient
    .from('profiles')
    .select('id, full_name, role');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  console.log(`Total profiles: ${profiles.length}\n`);

  // Create maps
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Find auth users without profiles
  console.log('═══════════════════════════════════════════════════════');
  console.log('AUTH USERS WITHOUT PROFILES (Need to delete these):');
  console.log('═══════════════════════════════════════════════════════\n');

  const authWithoutProfiles = authUsers.filter(u => !profilesMap.has(u.id));

  if (authWithoutProfiles.length === 0) {
    console.log('✅ None found - all auth users have profiles\n');
  } else {
    authWithoutProfiles.forEach(user => {
      console.log(`  📧 Email: ${user.email}`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Created: ${new Date(user.created_at).toLocaleString()}\n`);
    });
  }

  // Find profiles without auth users (orphaned)
  const authIdsSet = new Set(authUsers.map(u => u.id));
  const orphanedProfiles = profiles.filter(p => !authIdsSet.has(p.id));

  console.log('═══════════════════════════════════════════════════════');
  console.log('PROFILES WITHOUT AUTH USERS (Orphaned):');
  console.log('═══════════════════════════════════════════════════════\n');

  if (orphanedProfiles.length === 0) {
    console.log('✅ None found - all profiles have auth users\n');
  } else {
    orphanedProfiles.forEach(profile => {
      console.log(`  👤 Name: ${profile.full_name}`);
      console.log(`     Role: ${profile.role}`);
      console.log(`     ID: ${profile.id}\n`);
    });
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Auth users without profiles: ${authWithoutProfiles.length}`);
  console.log(`Orphaned profiles: ${orphanedProfiles.length}`);
  console.log(`Matched pairs: ${authUsers.length - authWithoutProfiles.length}`);
}

// Run the check
checkAuthVsProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
