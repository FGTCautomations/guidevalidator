import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Add a test DMC
    console.log('Adding test DMC...');
    const insertResult = await client.query(`
      INSERT INTO agencies (
        type, name, country_code, coverage_summary, verified
      ) VALUES (
        'dmc', 'Test DMC Company', 'DE', 'Test DMC in Germany', true
      )
      RETURNING id, name, type, verified
    `);

    const newDmc = insertResult.rows[0];
    console.log(`✓ Created DMC: ${newDmc.name} (${newDmc.id})\n`);

    // Check agencies table directly
    console.log('Checking agencies table...');
    const directQuery = await client.query(`
      SELECT id, name, type, verified
      FROM agencies
      WHERE type = 'dmc'
    `);
    console.log(`DMCs in agencies table: ${directQuery.rows.length}`);
    directQuery.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.id}) | Verified: ${row.verified}`);
    });

    // Check directory_dmcs view
    console.log('\nChecking directory_dmcs view...');
    const viewQuery = await client.query(`
      SELECT id, name, type, verified
      FROM directory_dmcs
    `);
    console.log(`DMCs in directory_dmcs view: ${viewQuery.rows.length}`);
    viewQuery.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.id}) | Verified: ${row.verified}`);
    });

    // Add a test transport company
    console.log('\n\nAdding test Transport company...');
    const transportResult = await client.query(`
      INSERT INTO agencies (
        type, name, country_code, coverage_summary, verified
      ) VALUES (
        'transport', 'Test Transport Co', 'FR', 'Test transport in France', true
      )
      RETURNING id, name, type, verified
    `);

    const newTransport = transportResult.rows[0];
    console.log(`✓ Created Transport: ${newTransport.name} (${newTransport.id})\n`);

    // Check transport in agencies table
    console.log('Checking agencies table for transport...');
    const transportDirect = await client.query(`
      SELECT id, name, type, verified
      FROM agencies
      WHERE type = 'transport'
    `);
    console.log(`Transport in agencies table: ${transportDirect.rows.length}`);
    transportDirect.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.id}) | Verified: ${row.verified}`);
    });

    // Check directory_transport view
    console.log('\nChecking directory_transport view...');
    const transportView = await client.query(`
      SELECT id, name, type, verified
      FROM directory_transport
    `);
    console.log(`Transport in directory_transport view: ${transportView.rows.length}`);
    transportView.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.id}) | Verified: ${row.verified}`);
    });

    // Summary
    console.log('\n\n=== SUMMARY ===');
    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM agencies WHERE type = 'agency') as agencies,
        (SELECT COUNT(*) FROM agencies WHERE type = 'dmc') as dmcs,
        (SELECT COUNT(*) FROM agencies WHERE type = 'transport') as transport,
        (SELECT COUNT(*) FROM directory_agencies) as dir_agencies,
        (SELECT COUNT(*) FROM directory_dmcs) as dir_dmcs,
        (SELECT COUNT(*) FROM directory_transport) as dir_transport
    `);
    const stats = summary.rows[0];

    console.log('Agencies table:');
    console.log(`  Agencies: ${stats.agencies}`);
    console.log(`  DMCs: ${stats.dmcs}`);
    console.log(`  Transport: ${stats.transport}`);

    console.log('\nDirectory views:');
    console.log(`  directory_agencies: ${stats.dir_agencies}`);
    console.log(`  directory_dmcs: ${stats.dir_dmcs}`);
    console.log(`  directory_transport: ${stats.dir_transport}`);

    if (stats.agencies === parseInt(stats.dir_agencies) &&
        stats.dmcs === parseInt(stats.dir_dmcs) &&
        stats.transport === parseInt(stats.dir_transport)) {
      console.log('\n✅ Views are in sync with agencies table!');
    } else {
      console.log('\n❌ Views are OUT OF SYNC with agencies table!');
    }

    console.log('\n✓ Test data added successfully');
    console.log('You can now check the directory pages:');
    console.log('  - DMCs: http://localhost:3000/en/directory?tab=dmcs');
    console.log('  - Transport: http://localhost:3000/en/directory?tab=transport');

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
