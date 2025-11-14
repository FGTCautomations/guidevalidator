const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteAllAuthUsersExceptAdmins() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE ALL AUTH USERS EXCEPT ADMINS          ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get the admin profile IDs that we want to keep
  console.log('Step 1: Fetching admin profile IDs to preserve...');
  const { data: adminProfiles, error: adminError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['admin', 'super_admin']);

  if (adminError) {
    console.error('Error fetching admin profiles:', adminError);
    return;
  }

  const adminIds = new Set(adminProfiles.map(p => p.id));
  console.log(`✓ Found ${adminProfiles.length} admin profiles to preserve:`);
  adminProfiles.forEach(p => {
    console.log(`  - ${p.full_name} (${p.role})`);
  });
  console.log('');

  // Step 2: Get all auth users
  console.log('Step 2: Fetching all auth users...');
  let allAuthUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage,
    });

    if (error) {
      console.error('Error fetching auth users:', error);
      break;
    }

    if (!data || !data.users || data.users.length === 0) break;

    allAuthUsers = allAuthUsers.concat(data.users);
    console.log(`  Fetched ${allAuthUsers.length} auth users so far...`);

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`✓ Total auth users found: ${allAuthUsers.length}\n`);

  // Step 3: Filter out admin users
  const usersToDelete = allAuthUsers.filter(u => !adminIds.has(u.id));
  console.log(`Users to delete: ${usersToDelete.length}`);
  console.log(`Users to preserve: ${allAuthUsers.length - usersToDelete.length}\n`);

  if (usersToDelete.length === 0) {
    console.log('No auth users to delete!');
    return;
  }

  // Step 4: Delete non-admin auth users
  console.log('Step 3: Deleting non-admin auth users...');
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < usersToDelete.length; i++) {
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(usersToDelete[i].id);
      if (!deleteError) {
        deleted++;
        if (deleted % 100 === 0) {
          console.log(`  Deleted ${deleted} auth users...`);
        }
      } else {
        errors++;
        if (errors <= 5) {
          console.error(`  Error deleting user ${usersToDelete[i].email}:`, deleteError.message);
        }
      }
    } catch (e) {
      errors++;
      if (errors <= 5) {
        console.error(`  Exception deleting user:`, e.message);
      }
    }

    // Add a small delay every 50 users to avoid rate limiting
    if (i > 0 && i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✓ Deleted ${deleted} auth users`);
  if (errors > 0) {
    console.log(`✗ ${errors} errors occurred\n`);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total auth users found:       ${allAuthUsers.length}`);
  console.log(`Admin users preserved:        ${allAuthUsers.length - usersToDelete.length}`);
  console.log(`Auth users deleted:           ${deleted}`);
  console.log(`Errors:                       ${errors}`);
  console.log('════════════════════════════════════════════════\n');

  // Verify remaining auth users
  console.log('Verifying remaining auth users...');
  const { data: remainingUsers } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (remainingUsers && remainingUsers.users) {
    console.log(`\n✓ ${remainingUsers.users.length} auth users remaining:`);
    remainingUsers.users.forEach(u => {
      const isAdmin = adminIds.has(u.id);
      console.log(`  - ${u.email} ${isAdmin ? '(ADMIN)' : ''}`);
    });
  }
  console.log('');
}

deleteAllAuthUsersExceptAdmins()
  .then(() => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
