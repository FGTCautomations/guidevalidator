/**
 * Cleanup Orphaned Profiles Script
 *
 * This script removes profiles that exist without corresponding auth users.
 * This can happen when auth users are deleted but profiles remain.
 *
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-profiles.ts
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

async function cleanupOrphanedProfiles() {
  console.log('🔍 Finding all profiles...\n');

  // Get all profiles
  const { data: profiles, error: profilesError } = await serviceClient
    .from('profiles')
    .select('id, full_name, role, created_at');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} total profiles\n`);

  // Get all auth users
  const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    process.exit(1);
  }

  console.log(`Found ${authUsers.users.length} total auth users\n`);

  // Find orphaned profiles (profiles without auth users)
  const authUserIds = new Set(authUsers.users.map(u => u.id));
  const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id));

  if (orphanedProfiles.length === 0) {
    console.log('✅ No orphaned profiles found. Database is clean!');
    return;
  }

  console.log(`⚠️  Found ${orphanedProfiles.length} orphaned profile(s):\n`);
  orphanedProfiles.forEach(profile => {
    console.log(`  - ${profile.full_name} (${profile.role}) - ID: ${profile.id}`);
    console.log(`    Created: ${new Date(profile.created_at).toLocaleString()}`);
  });
  console.log();

  // Delete orphaned profiles and related records
  for (const profile of orphanedProfiles) {
    console.log(`🗑️  Deleting orphaned profile: ${profile.full_name}`);

    try {
      // Step 1: Delete guide records (if any)
      const { error: guideError } = await serviceClient
        .from('guides')
        .delete()
        .eq('profile_id', profile.id);

      if (guideError && guideError.code !== 'PGRST116') {
        console.log(`   ⚠️  Error deleting guide: ${guideError.message}`);
      } else {
        console.log(`   ✓ Guide record deleted (if existed)`);
      }

      // Step 2: Delete agency records (if any)
      const { error: agencyError } = await serviceClient
        .from('agencies')
        .delete()
        .eq('id', profile.id);

      if (agencyError && agencyError.code !== 'PGRST116') {
        console.log(`   ⚠️  Error deleting agency: ${agencyError.message}`);
      } else {
        console.log(`   ✓ Agency record deleted (if existed)`);
      }

      // Step 3: Delete profile
      const { error: profileError } = await serviceClient
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) {
        console.log(`   ❌ Error deleting profile: ${profileError.message}`);
      } else {
        console.log(`   ✓ Profile deleted`);
      }

      console.log(`   ✅ ${profile.full_name} cleanup complete\n`);
    } catch (error) {
      console.error(`   ❌ Unexpected error:`, error);
    }
  }

  console.log('🎉 All orphaned profiles have been cleaned up!');
  console.log('📝 You can now retry the bulk upload.');
}

// Run the cleanup
cleanupOrphanedProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
