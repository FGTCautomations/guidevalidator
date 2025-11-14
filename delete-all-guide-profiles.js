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

async function deleteAllGuideProfiles() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE ALL GUIDE PROFILES                     ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Fetch all guide profile IDs
  console.log('Step 1: Fetching all guide profiles...');
  let allGuideProfileIds = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'guide')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching guide profiles:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allGuideProfileIds = allGuideProfileIds.concat(data.map(p => p.id));
    console.log(`  Found ${allGuideProfileIds.length} guide profiles so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`✓ Found ${allGuideProfileIds.length} total guide profiles\n`);

  if (allGuideProfileIds.length === 0) {
    console.log('No guide profiles to delete!');
    return { deleted: 0, errors: 0 };
  }

  // Step 2: Delete auth accounts
  console.log('Step 2: Deleting auth accounts...');
  let deletedAuthCount = 0;
  let authErrors = 0;

  for (const profileId of allGuideProfileIds) {
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(profileId);
      if (!authDeleteError) {
        deletedAuthCount++;
        if (deletedAuthCount % 100 === 0) {
          console.log(`  Deleted ${deletedAuthCount} auth accounts...`);
        }
      } else {
        authErrors++;
      }
    } catch (e) {
      // User might not exist in auth, continue
      authErrors++;
    }
  }

  console.log(`✓ Deleted ${deletedAuthCount} auth accounts (${authErrors} errors/not found)\n`);

  // Step 3: Delete profiles in batches
  console.log('Step 3: Deleting guide profiles in batches...');
  let deletedProfiles = 0;
  let profileErrors = 0;
  const batchSize = 100;

  for (let i = 0; i < allGuideProfileIds.length; i += batchSize) {
    const batch = allGuideProfileIds.slice(i, i + batchSize);

    const { error: profilesDeleteError, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .in('id', batch);

    if (profilesDeleteError) {
      console.error(`  ✗ Error deleting batch ${i}-${i+batchSize}:`, {
        message: profilesDeleteError.message,
        details: profilesDeleteError.details,
        hint: profilesDeleteError.hint
      });
      profileErrors += batch.length;
      continue;
    }

    deletedProfiles += count || batch.length;
    if (deletedProfiles % 500 === 0 || i + batchSize >= allGuideProfileIds.length) {
      console.log(`  Deleted ${deletedProfiles} profiles...`);
    }
  }

  console.log(`✓ Deleted ${deletedProfiles} guide profiles\n`);

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total guide profiles found:   ${allGuideProfileIds.length}`);
  console.log(`Auth accounts deleted:        ${deletedAuthCount}`);
  console.log(`Profiles deleted:             ${deletedProfiles}`);
  console.log(`Errors:                       ${profileErrors}`);
  console.log('════════════════════════════════════════════════\n');

  return { deleted: deletedProfiles, errors: profileErrors };
}

deleteAllGuideProfiles()
  .then((result) => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
