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

async function deleteAuthUsersBatch() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE AUTH USERS IN BATCHES                  ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get admin IDs to preserve
  console.log('Step 1: Fetching admin IDs to preserve...');
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['admin', 'super_admin']);

  const adminIds = new Set(adminProfiles.map(p => p.id));
  console.log(`✓ Preserving ${adminProfiles.length} admin accounts:`);
  adminProfiles.forEach(p => console.log(`  - ${p.full_name} (${p.role})`));
  console.log('');

  // Step 2: Fetch and delete in batches
  console.log('Step 2: Fetching and deleting users in batches...\n');

  let totalDeleted = 0;
  let totalErrors = 0;
  let totalProcessed = 0;
  let page = 1;
  const perPage = 100; // Smaller batch size to avoid timeouts

  while (true) {
    console.log(`Fetching page ${page}...`);

    try {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage,
      });

      if (error) {
        console.error(`  ✗ Error fetching page ${page}:`, error.message);

        // If we get an error, wait a bit and retry once
        console.log('  Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const { data: retryData, error: retryError } = await supabase.auth.admin.listUsers({
          page: page,
          perPage: perPage,
        });

        if (retryError) {
          console.error(`  ✗ Retry failed, skipping page ${page}`);
          page++;
          continue;
        }

        // Use retry data
        if (!retryData || !retryData.users || retryData.users.length === 0) {
          console.log('✓ No more users found\n');
          break;
        }

        console.log(`  ✓ Fetched ${retryData.users.length} users on retry`);

        // Delete non-admin users from this batch
        for (const user of retryData.users) {
          totalProcessed++;

          if (adminIds.has(user.id)) {
            console.log(`  → Preserving admin: ${user.email}`);
            continue;
          }

          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (!deleteError) {
              totalDeleted++;
            } else {
              totalErrors++;
            }
          } catch (e) {
            totalErrors++;
          }

          // Progress update every 50 deletions
          if (totalDeleted % 50 === 0) {
            console.log(`  Progress: ${totalDeleted} deleted, ${totalErrors} errors`);
          }

          // Small delay to avoid rate limiting
          if (totalProcessed % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        page++;
        continue;
      }

      if (!data || !data.users || data.users.length === 0) {
        console.log('✓ No more users found\n');
        break;
      }

      console.log(`  ✓ Fetched ${data.users.length} users`);

      // Delete non-admin users from this batch
      for (const user of data.users) {
        totalProcessed++;

        if (adminIds.has(user.id)) {
          console.log(`  → Preserving admin: ${user.email}`);
          continue;
        }

        try {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          if (!deleteError) {
            totalDeleted++;
          } else {
            totalErrors++;
            if (totalErrors <= 10) {
              console.error(`  ✗ Error deleting ${user.email}:`, deleteError.message);
            }
          }
        } catch (e) {
          totalErrors++;
          if (totalErrors <= 10) {
            console.error(`  ✗ Exception deleting user:`, e.message);
          }
        }

        // Progress update every 50 deletions
        if (totalDeleted % 50 === 0 && totalDeleted > 0) {
          console.log(`  Progress: ${totalDeleted} deleted, ${totalErrors} errors`);
        }

        // Small delay to avoid rate limiting
        if (totalProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // If we got fewer users than perPage, we're done
      if (data.users.length < perPage) {
        console.log('\n✓ Reached end of users list\n');
        break;
      }

      page++;

      // Delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`  ✗ Unexpected error on page ${page}:`, err.message);
      console.log('  Waiting 5 seconds before continuing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      page++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total users processed:        ${totalProcessed}`);
  console.log(`Admin users preserved:        ${adminProfiles.length}`);
  console.log(`Auth users deleted:           ${totalDeleted}`);
  console.log(`Errors:                       ${totalErrors}`);
  console.log('════════════════════════════════════════════════\n');
}

deleteAuthUsersBatch()
  .then(() => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
