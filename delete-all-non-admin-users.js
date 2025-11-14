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

async function deleteAllNonAdminUsers() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE ALL NON-ADMIN USERS                    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get all non-admin profile IDs in batches
  console.log('Step 1: Fetching non-admin profile IDs...');
  let userIds = [];
  let from = 0;
  const fetchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .not('role', 'in', '(admin,super_admin)')
      .range(from, from + fetchSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    userIds = userIds.concat(data.map(p => ({ id: p.id, full_name: p.full_name, role: p.role })));
    console.log(`  Found ${userIds.length} non-admin users so far...`);

    if (data.length < fetchSize) break;
    from += fetchSize;
  }

  console.log(`✓ Total non-admin users: ${userIds.length}`);

  // Show breakdown by role
  const roleCount = {};
  userIds.forEach(u => {
    roleCount[u.role] = (roleCount[u.role] || 0) + 1;
  });
  console.log('\nBreakdown by role:');
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
  console.log('');

  if (userIds.length === 0) {
    console.log('No non-admin users to delete!');
    return;
  }

  const profileIds = userIds.map(u => u.id);

  // Step 2: Delete audit logs in batches
  console.log('Step 2: Deleting audit logs for non-admin users...');
  let totalAuditLogsDeleted = 0;
  const batchSize = 100;

  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);

    const { error: auditError, count } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .in('actor_id', batch);

    if (auditError) {
      console.error(`  ✗ Error deleting audit logs for batch ${i}:`, auditError.message);
      continue;
    }

    totalAuditLogsDeleted += count || 0;
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= profileIds.length) {
      console.log(`  Deleted ${totalAuditLogsDeleted} audit logs...`);
    }
  }

  console.log(`✓ Deleted ${totalAuditLogsDeleted} audit logs\n`);

  // Step 3: Delete from other tables that might reference profiles
  console.log('Step 3: Deleting related records...');

  // Delete guides
  let guidesDeleted = 0;
  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    const { count } = await supabase
      .from('guides')
      .delete({ count: 'exact' })
      .in('profile_id', batch);
    guidesDeleted += count || 0;
  }
  console.log(`  ✓ Deleted ${guidesDeleted} guide records`);

  // Delete profile_claim_tokens
  let claimTokensDeleted = 0;
  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    const { count } = await supabase
      .from('profile_claim_tokens')
      .delete({ count: 'exact' })
      .in('profile_id', batch);
    claimTokensDeleted += count || 0;
  }
  console.log(`  ✓ Deleted ${claimTokensDeleted} claim tokens\n`);

  // Step 4: Delete auth accounts
  console.log('Step 4: Deleting auth accounts...');
  let deletedAuthCount = 0;
  let authErrors = 0;

  for (let i = 0; i < profileIds.length; i++) {
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(profileIds[i]);
      if (!authDeleteError) {
        deletedAuthCount++;
        if (deletedAuthCount % 100 === 0) {
          console.log(`  Deleted ${deletedAuthCount} auth accounts...`);
        }
      } else {
        authErrors++;
      }
    } catch (e) {
      authErrors++;
    }
  }

  console.log(`✓ Deleted ${deletedAuthCount} auth accounts (${authErrors} errors/not found)\n`);

  // Step 5: Delete profiles in batches
  console.log('Step 5: Deleting user profiles...');
  let totalProfilesDeleted = 0;

  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);

    const { error: profileError, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .in('id', batch);

    if (profileError) {
      console.error(`  ✗ Error deleting profiles for batch ${i}:`, profileError.message);
      continue;
    }

    totalProfilesDeleted += count || 0;
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= profileIds.length) {
      console.log(`  Deleted ${totalProfilesDeleted} profiles...`);
    }
  }

  console.log(`✓ Deleted ${totalProfilesDeleted} profiles\n`);

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Non-admin users found:        ${userIds.length}`);
  console.log(`Audit logs deleted:           ${totalAuditLogsDeleted}`);
  console.log(`Guide records deleted:        ${guidesDeleted}`);
  console.log(`Claim tokens deleted:         ${claimTokensDeleted}`);
  console.log(`Auth accounts deleted:        ${deletedAuthCount}`);
  console.log(`Profiles deleted:             ${totalProfilesDeleted}`);
  console.log('════════════════════════════════════════════════\n');

  // Check remaining admins
  console.log('Verifying remaining users...');
  const { data: remainingUsers, error: checkError } = await supabase
    .from('profiles')
    .select('id, full_name, role');

  if (!checkError && remainingUsers) {
    console.log(`\n✓ ${remainingUsers.length} admin users remaining:`);
    remainingUsers.forEach(u => {
      console.log(`  - ${u.full_name} (${u.role})`);
    });
  }
  console.log('');
}

deleteAllNonAdminUsers()
  .then(() => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
