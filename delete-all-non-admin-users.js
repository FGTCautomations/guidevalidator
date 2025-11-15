// Delete all non-admin users from authentication and database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteNonAdminUsers() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Delete All Non-Admin Users                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Step 1: Get all profiles that are NOT admins
  console.log('Finding non-admin users...\n');

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .not('role', 'in', '(admin,super_admin)');

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles.length} non-admin users:\n`);

  if (profiles.length === 0) {
    console.log('No non-admin users to delete.\n');
    return;
  }

  // Show first 10
  profiles.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.full_name || p.id} (${p.role || 'no role'})`);
  });

  if (profiles.length > 10) {
    console.log(`  ... and ${profiles.length - 10} more\n`);
  } else {
    console.log('');
  }

  // Step 2: Delete guides in batches (will cascade to guide_countries, guide_regions, guide_cities)
  console.log('Deleting guides...');

  const guideIds = profiles.map(p => p.id);
  const batchSize = 50;
  let guidesDeleted = 0;

  for (let i = 0; i < guideIds.length; i += batchSize) {
    const batch = guideIds.slice(i, i + batchSize);
    const { error: guidesError } = await supabase
      .from('guides')
      .delete()
      .in('profile_id', batch);

    if (guidesError) {
      console.log(`  ⚠️  Warning for batch ${i}: ${guidesError.message}`);
    } else {
      guidesDeleted += batch.length;
      if (guidesDeleted % 100 === 0 || i + batchSize >= guideIds.length) {
        console.log(`  Deleted ${guidesDeleted} guides...`);
      }
    }
  }

  console.log('✅ Guides deleted\n');

  // Step 3: Delete profiles in batches
  console.log('Deleting profiles...');

  let profilesDeleted = 0;

  for (let i = 0; i < guideIds.length; i += batchSize) {
    const batch = guideIds.slice(i, i + batchSize);
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .in('id', batch);

    if (deleteProfilesError) {
      console.log(`  ❌ Error for batch ${i}: ${deleteProfilesError.message}`);
    } else {
      profilesDeleted += batch.length;
      if (profilesDeleted % 100 === 0 || i + batchSize >= guideIds.length) {
        console.log(`  Deleted ${profilesDeleted} profiles...`);
      }
    }
  }

  console.log('✅ Profiles deleted\n');

  // Step 4: Delete from auth.users
  console.log('Deleting from authentication...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.id);

      if (authError) {
        console.log(`  ❌ Failed to delete auth user: ${profile.full_name || profile.id}`);
        errorCount++;
      } else {
        deletedCount++;
        if (deletedCount % 10 === 0) {
          console.log(`  Deleted ${deletedCount}/${profiles.length} auth users...`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Error deleting ${profile.full_name || profile.id}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              CLEANUP SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully deleted: ${deletedCount} users`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount} users`);
  }
  console.log('\n✅ Cleanup complete!\n');
}

deleteNonAdminUsers().catch(console.error);
