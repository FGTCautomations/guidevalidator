import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    console.log('=== ROW LEVEL SECURITY POLICIES ===\n');

    // Check RLS on agencies table
    console.log('1. AGENCIES TABLE RLS');
    const agenciesRLS = await client.query(`
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
      WHERE tablename = 'agencies'
      ORDER BY policyname
    `);

    if (agenciesRLS.rows.length === 0) {
      console.log('✓ No RLS policies on agencies table (public read access)');
    } else {
      console.log(`Found ${agenciesRLS.rows.length} RLS policies:`);
      agenciesRLS.rows.forEach((row: any) => {
        console.log(`\n  Policy: ${row.policyname}`);
        console.log(`  Command: ${row.cmd}`);
        console.log(`  Roles: ${row.roles}`);
        console.log(`  Using: ${row.qual || 'N/A'}`);
      });
    }

    // Check if RLS is enabled
    const rlsEnabled = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname IN ('agencies', 'profiles', 'guides')
      AND relnamespace = 'public'::regnamespace
    `);

    console.log('\n2. RLS STATUS');
    rlsEnabled.rows.forEach((row: any) => {
      console.log(`  ${row.relname}: ${row.relrowsecurity ? '🔒 ENABLED' : '🔓 DISABLED'}`);
    });

    // Test actual SELECT permissions
    console.log('\n3. TESTING ACTUAL SELECT ACCESS');

    // Test as anonymous user
    console.log('\nTesting SELECT as anonymous (anon role):');
    try {
      await client.query('SET ROLE anon');
      const anonTest = await client.query(`
        SELECT id, name, type
        FROM agencies
        WHERE type = 'dmc'
        LIMIT 1
      `);
      console.log(`  ✓ Can read DMCs: ${anonTest.rows.length} rows`);
      if (anonTest.rows.length > 0) {
        console.log(`    Sample: ${anonTest.rows[0].name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ Cannot read: ${err.message}`);
    } finally {
      await client.query('RESET ROLE');
    }

    // Test as authenticated
    console.log('\nTesting SELECT as authenticated user:');
    try {
      await client.query('SET ROLE authenticated');
      const authTest = await client.query(`
        SELECT id, name, type
        FROM agencies
        WHERE type = 'dmc'
        LIMIT 1
      `);
      console.log(`  ✓ Can read DMCs: ${authTest.rows.length} rows`);
      if (authTest.rows.length > 0) {
        console.log(`    Sample: ${authTest.rows[0].name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ Cannot read: ${err.message}`);
    } finally {
      await client.query('RESET ROLE');
    }

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
