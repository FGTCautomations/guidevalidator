import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check for directory views
    console.log('=== DIRECTORY VIEWS ===');
    const views = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'directory_%'
      ORDER BY table_name
    `);

    console.log(`Found ${views.rows.length} directory views/tables:\n`);
    views.rows.forEach((row: any) => {
      console.log(`  ${row.table_name} (${row.table_type})`);
    });

    // Check what's in each directory view
    if (views.rows.length > 0) {
      for (const view of views.rows) {
        const tableName = view.table_name;
        console.log(`\n=== ${tableName.toUpperCase()} ===`);

        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`Total rows: ${count.rows[0].count}`);

          const sample = await client.query(`SELECT * FROM ${tableName} LIMIT 3`);
          if (sample.rows.length > 0) {
            console.log('Sample data:');
            sample.rows.forEach((row: any, idx: number) => {
              console.log(`  ${idx + 1}. ID: ${row.id || row.profile_id || 'N/A'} | Name: ${row.name || row.full_name || 'N/A'}`);
            });
          } else {
            console.log('  No data in this view');
          }
        } catch (err: any) {
          console.log(`  Error querying: ${err.message}`);
        }
      }
    }

    // Check if we're querying the right tables in our code
    console.log('\n\n=== VERIFICATION ===');
    console.log('Checking what the app queries vs what exists...\n');

    // Check agencies table
    const agenciesCount = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM agencies WHERE type = 'agency') as agencies,
        (SELECT COUNT(*) FROM agencies WHERE type = 'dmc') as dmcs,
        (SELECT COUNT(*) FROM agencies WHERE type = 'transport') as transport
    `);
    const stats = agenciesCount.rows[0];
    console.log('Direct agencies table query:');
    console.log(`  Agencies (type='agency'): ${stats.agencies}`);
    console.log(`  DMCs (type='dmc'): ${stats.dmcs}`);
    console.log(`  Transport (type='transport'): ${stats.transport}`);

    // Check if directory views have different data
    const directoryAgencies = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('directory_agencies', 'directory_dmcs', 'directory_transport')
    `).catch(() => ({ rows: [] }));

    if (directoryAgencies.rows.length > 0) {
      console.log('\n⚠️  WARNING: Directory views exist! Checking their contents...\n');

      for (const view of directoryAgencies.rows) {
        const tableName = view.table_name;
        const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`${tableName}: ${count.rows[0].count} rows`);
      }

      console.log('\n❌ PROBLEM FOUND:');
      console.log('The app may be querying directory views instead of the agencies table!');
      console.log('This would cause new agencies/DMCs/transport to not appear until the view is refreshed.');
    } else {
      console.log('\n✅ No separate directory views found - app queries agencies table directly');
    }

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
