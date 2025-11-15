// Check guides table schema to see license number field
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkSchema() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guides Table Schema                        ║');
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

    // Get columns from guides table
    const columnsQuery = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'guides'
      AND column_name LIKE '%license%'
      ORDER BY ordinal_position;
    `);

    console.log('License-related columns in guides table:\n');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Check guides_browse_v view
    const viewQuery = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'guides_browse_v'
      AND column_name LIKE '%license%'
      ORDER BY ordinal_position;
    `);

    console.log('\nLicense-related columns in guides_browse_v view:\n');
    if (viewQuery.rows.length > 0) {
      viewQuery.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('  (none found)');
    }

    // Sample a guide with license
    const sampleQuery = await client.query(`
      SELECT id, name, license_number, license_verified
      FROM guides
      WHERE license_number IS NOT NULL
      LIMIT 1;
    `);

    if (sampleQuery.rows.length > 0) {
      console.log('\nSample guide with license:\n');
      console.log(`  Name: ${sampleQuery.rows[0].name}`);
      console.log(`  License: ${sampleQuery.rows[0].license_number}`);
      console.log(`  Verified: ${sampleQuery.rows[0].license_verified}`);
    }

    console.log('\n✅ Done\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSchema().catch(console.error);
