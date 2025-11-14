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

async function deleteGuidesWithDependencies() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE GUIDE PROFILES WITH DEPENDENCIES      ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get all guide profile IDs in batches
  console.log('Step 1: Fetching guide profile IDs...');
  let guideIds = [];
  let from = 0;
  const fetchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'guide')
      .range(from, from + fetchSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    guideIds = guideIds.concat(data.map(p => p.id));
    console.log(`  Found ${guideIds.length} guide IDs so far...`);

    if (data.length < fetchSize) break;
    from += fetchSize;
  }

  console.log(`✓ Total guide profiles: ${guideIds.length}\n`);

  if (guideIds.length === 0) {
    console.log('No guide profiles to delete!');
    return;
  }

  // Step 2: Delete audit logs in batches
  console.log('Step 2: Deleting audit logs for guides...');
  let totalAuditLogsDeleted = 0;
  const batchSize = 100;

  for (let i = 0; i < guideIds.length; i += batchSize) {
    const batch = guideIds.slice(i, i + batchSize);

    const { error: auditError, count } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .in('actor_id', batch);

    if (auditError) {
      console.error(`  ✗ Error deleting audit logs for batch ${i}:`, auditError.message);
      continue;
    }

    totalAuditLogsDeleted += count || 0;
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= guideIds.length) {
      console.log(`  Deleted ${totalAuditLogsDeleted} audit logs...`);
    }
  }

  console.log(`✓ Deleted ${totalAuditLogsDeleted} audit logs\n`);

  // Step 3: Delete profiles in batches
  console.log('Step 3: Deleting guide profiles...');
  let totalProfilesDeleted = 0;

  for (let i = 0; i < guideIds.length; i += batchSize) {
    const batch = guideIds.slice(i, i + batchSize);

    const { error: profileError, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .in('id', batch);

    if (profileError) {
      console.error(`  ✗ Error deleting profiles for batch ${i}:`, profileError.message);
      continue;
    }

    totalProfilesDeleted += count || 0;
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= guideIds.length) {
      console.log(`  Deleted ${totalProfilesDeleted} profiles...`);
    }
  }

  console.log(`✓ Deleted ${totalProfilesDeleted} profiles\n`);

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Guide profiles found:         ${guideIds.length}`);
  console.log(`Audit logs deleted:           ${totalAuditLogsDeleted}`);
  console.log(`Profiles deleted:             ${totalProfilesDeleted}`);
  console.log('════════════════════════════════════════════════\n');
}

deleteGuidesWithDependencies()
  .then(() => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
