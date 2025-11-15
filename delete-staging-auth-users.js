// Delete all auth users with email ending in @guidecvalidator-staging.com
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteStagingAuthUsers() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Delete Staging Auth Users                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('Fetching all auth users...\n');

  // Fetch all users from auth
  let allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      console.error('❌ Error fetching users:', error);
      break;
    }

    if (!data.users || data.users.length === 0) break;

    allUsers = allUsers.concat(data.users);
    console.log(`  Fetched ${allUsers.length} users so far...`);

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`\n✅ Total auth users: ${allUsers.length}\n`);

  // Filter for staging emails
  const stagingUsers = allUsers.filter(user =>
    user.email && user.email.endsWith('@guidevalidator-staging.com')
  );

  console.log(`Found ${stagingUsers.length} staging users:\n`);

  if (stagingUsers.length === 0) {
    console.log('No staging users to delete.\n');
    return;
  }

  // Show first 10
  stagingUsers.slice(0, 10).forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`);
  });

  if (stagingUsers.length > 10) {
    console.log(`  ... and ${stagingUsers.length - 10} more\n`);
  } else {
    console.log('');
  }

  // Delete staging users
  console.log('Deleting staging auth users...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const user of stagingUsers) {
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.log(`  ❌ Failed to delete: ${user.email}`);
        errorCount++;
      } else {
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount}/${stagingUsers.length} staging users...`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Error deleting ${user.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              CLEANUP SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`Total staging users found:    ${stagingUsers.length}`);
  console.log(`✅ Successfully deleted:       ${deletedCount}`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors:                    ${errorCount}`);
  }
  console.log('\n✅ Cleanup complete!\n');

  // Show remaining count
  console.log('Verifying remaining users...\n');
  const { data: finalData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });

  if (finalData) {
    console.log(`Remaining auth users: ~${finalData.total || 'unknown'}\n`);
  }
}

deleteStagingAuthUsers().catch(console.error);
