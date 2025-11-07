import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check if materialized views exist
    console.log('=== CHECKING MATERIALIZED VIEWS ===');
    const views = await client.query(`
      SELECT matviewname
      FROM pg_matviews
      WHERE schemaname = 'public'
      AND matviewname IN ('agencies_browse_v', 'dmcs_browse_v', 'transport_browse_v')
      ORDER BY matviewname
    `);

    if (views.rows.length === 0) {
      console.log('❌ NO MATERIALIZED VIEWS FOUND');
      console.log('The migration has NOT been applied yet.\n');
      console.log('Please run the SQL migration in Supabase SQL Editor.');
      await client.end();
      return;
    }

    console.log(`✓ Found ${views.rows.length} materialized views:\n`);
    views.rows.forEach((row: any) => {
      console.log(`  - ${row.matviewname}`);
    });

    // Check row counts
    console.log('\n=== ROW COUNTS ===');
    const agenciesCount = await client.query('SELECT COUNT(*) as count FROM agencies_browse_v');
    const dmcsCount = await client.query('SELECT COUNT(*) as count FROM dmcs_browse_v');
    const transportCount = await client.query('SELECT COUNT(*) as count FROM transport_browse_v');

    console.log(`agencies_browse_v: ${agenciesCount.rows[0].count} rows`);
    console.log(`dmcs_browse_v: ${dmcsCount.rows[0].count} rows`);
    console.log(`transport_browse_v: ${transportCount.rows[0].count} rows`);

    // Check if RPC functions exist
    console.log('\n=== CHECKING RPC FUNCTIONS ===');
    const functions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('api_agencies_search', 'api_dmcs_search', 'api_transport_search')
      ORDER BY routine_name
    `);

    console.log(`✓ Found ${functions.rows.length} RPC functions:\n`);
    functions.rows.forEach((row: any) => {
      console.log(`  - ${row.routine_name}()`);
    });

    // Test the RPC functions
    console.log('\n=== TESTING RPC FUNCTIONS ===');

    console.log('\n1. Testing api_agencies_search():');
    const agenciesTest = await client.query(`
      SELECT api_agencies_search(
        p_country := 'US',
        p_limit := 3
      ) as result
    `);
    const agenciesResult = agenciesTest.rows[0].result;
    console.log(`   Results: ${agenciesResult.results?.length || 0} agencies`);
    if (agenciesResult.results?.length > 0) {
      console.log(`   Sample: ${agenciesResult.results[0].name}`);
    }

    console.log('\n2. Testing api_dmcs_search():');
    const dmcsTest = await client.query(`
      SELECT api_dmcs_search(
        p_country := 'FR',
        p_limit := 3
      ) as result
    `);
    const dmcsResult = dmcsTest.rows[0].result;
    console.log(`   Results: ${dmcsResult.results?.length || 0} DMCs`);
    if (dmcsResult.results?.length > 0) {
      console.log(`   Sample: ${dmcsResult.results[0].name}`);
    }

    console.log('\n3. Testing api_transport_search():');
    const transportTest = await client.query(`
      SELECT api_transport_search(
        p_country := 'FR',
        p_limit := 3
      ) as result
    `);
    const transportResult = transportTest.rows[0].result;
    console.log(`   Results: ${transportResult.results?.length || 0} transport companies`);
    if (transportResult.results?.length > 0) {
      console.log(`   Sample: ${transportResult.results[0].name}`);
    }

    console.log('\n✅ All systems operational!');
    console.log('\nNext: Check if Edge Functions are deployed and frontend is working.');

    await client.end();
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
