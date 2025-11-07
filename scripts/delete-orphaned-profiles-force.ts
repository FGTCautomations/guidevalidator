/**
 * Force Delete Orphaned Profiles
 *
 * This script forcefully deletes profiles that don't have corresponding auth users,
 * including handling foreign key constraints properly.
 *
 * Usage:
 *   npx tsx scripts/delete-orphaned-profiles-force.ts
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

async function deleteOrphanedProfiles() {
  console.log('🔍 Finding orphaned profiles (profiles without auth users)...\n');

  // Get all profiles
  const { data: profiles, error: profilesError } = await serviceClient
    .from('profiles')
    .select('id, full_name, role, created_at');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  // Get all auth users
  const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    process.exit(1);
  }

  // Find orphaned profiles
  const authUserIds = new Set(authData.users.map(u => u.id));
  const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id));

  if (orphanedProfiles.length === 0) {
    console.log('✅ No orphaned profiles found!\n');
    return;
  }

  console.log(`Found ${orphanedProfiles.length} orphaned profile(s):\n`);
  orphanedProfiles.forEach(profile => {
    console.log(`  - ${profile.full_name} (${profile.role})`);
    console.log(`    ID: ${profile.id}`);
    console.log(`    Created: ${new Date(profile.created_at).toLocaleString()}\n`);
  });

  // Delete each orphaned profile and ALL related records
  for (const profile of orphanedProfiles) {
    console.log(`🗑️  Deleting: ${profile.full_name} (${profile.role})`);

    try {
      // Step 1: Delete related records in correct order (children first)

      // Delete guide-related records
      if (profile.role === 'guide') {
        // Delete guide countries
        await serviceClient.from('guide_countries').delete().eq('guide_id', profile.id);
        console.log(`   ✓ Deleted guide_countries (if any)`);

        // Delete guide regions
        await serviceClient.from('guide_regions').delete().eq('guide_id', profile.id);
        console.log(`   ✓ Deleted guide_regions (if any)`);

        // Delete guide cities
        await serviceClient.from('guide_cities').delete().eq('guide_id', profile.id);
        console.log(`   ✓ Deleted guide_cities (if any)`);

        // Delete guide credentials
        await serviceClient.from('guide_credentials').delete().eq('profile_id', profile.id);
        console.log(`   ✓ Deleted guide_credentials (if any)`);

        // Delete guide record
        await serviceClient.from('guides').delete().eq('profile_id', profile.id);
        console.log(`   ✓ Deleted guides record (if any)`);
      }

      // Delete agency/DMC/transport-related records
      if (['agency', 'dmc', 'transport'].includes(profile.role)) {
        // Delete DMC coverage tables
        await serviceClient.from('dmc_countries').delete().eq('agency_id', profile.id);
        console.log(`   ✓ Deleted dmc_countries (if any)`);

        await serviceClient.from('dmc_regions').delete().eq('agency_id', profile.id);
        console.log(`   ✓ Deleted dmc_regions (if any)`);

        await serviceClient.from('dmc_cities').delete().eq('agency_id', profile.id);
        console.log(`   ✓ Deleted dmc_cities (if any)`);

        // Delete agency members
        await serviceClient.from('agency_members').delete().eq('agency_id', profile.id);
        console.log(`   ✓ Deleted agency_members (if any)`);

        // Delete agency record
        await serviceClient.from('agencies').delete().eq('id', profile.id);
        console.log(`   ✓ Deleted agencies record (if any)`);
      }

      // Delete conversation-related records
      // Delete conversation participants
      await serviceClient.from('conversation_participants').delete().eq('user_id', profile.id);
      console.log(`   ✓ Deleted conversation_participants (if any)`);

      // Update conversations to remove references (set to null instead of delete)
      await serviceClient.from('conversations').update({ created_by: null }).eq('created_by', profile.id);
      console.log(`   ✓ Updated conversations (removed created_by references)`);

      // Delete messages
      await serviceClient.from('messages').delete().eq('sender_id', profile.id);
      console.log(`   ✓ Deleted messages (if any)`);

      // Delete reviews
      await serviceClient.from('reviews').delete().eq('reviewer_id', profile.id);
      await serviceClient.from('reviews').delete().eq('reviewee_id', profile.id);
      console.log(`   ✓ Deleted reviews (if any)`);

      // Delete bookings/jobs related
      await serviceClient.from('bookings').delete().eq('guide_id', profile.id);
      await serviceClient.from('bookings').delete().eq('client_id', profile.id);
      console.log(`   ✓ Deleted bookings (if any)`);

      // Finally, delete the profile
      const { error: profileError } = await serviceClient
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) {
        console.log(`   ❌ Error deleting profile: ${profileError.message}`);
        console.log(`   Code: ${profileError.code}`);
      } else {
        console.log(`   ✅ Profile deleted successfully`);
      }

      console.log();
    } catch (error: any) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      console.log();
    }
  }

  console.log('🎉 Cleanup complete!');
  console.log('📝 You can now retry the bulk upload.');
}

// Run the cleanup
deleteOrphanedProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
