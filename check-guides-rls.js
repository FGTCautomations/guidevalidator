// Check RLS policies on guides table
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkRLS() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guides Table RLS Policies                  ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const client = new Client({
    host: 'db.vhqzmunorymtoisijiqb.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vertrouwen17#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check if RLS is enabled
    const rlsQuery = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE tablename = 'guides';
    `);

    console.log('RLS Status:\n');
    rlsQuery.rows.forEach(row => {
      console.log(`  Table: ${row.tablename}`);
      console.log(`  RLS Enabled: ${row.rowsecurity}\n`);
    });

    // Check RLS policies
    const policiesQuery = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'guides';
    `);

    if (policiesQuery.rows.length > 0) {
      console.log('RLS Policies on guides table:\n');
      policiesQuery.rows.forEach((policy, i) => {
        console.log(`${i + 1}. Policy: ${policy.policyname}`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   Roles: ${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}`);
        console.log(`   Permissive: ${policy.permissive}`);
        console.log(`   Using: ${policy.qual || '(none)'}`);
        console.log(`   With check: ${policy.with_check || '(none)'}\n`);
      });
    } else {
      console.log('No RLS policies found on guides table\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkRLS().catch(console.error);
