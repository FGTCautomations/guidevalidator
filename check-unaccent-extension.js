// Check if unaccent extension is installed
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkExtension() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check unaccent Extension                         ║');
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

    // Check if unaccent extension exists
    const extQuery = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'unaccent';
    `);

    if (extQuery.rows.length > 0) {
      console.log('✅ unaccent extension is installed\n');
    } else {
      console.log('❌ unaccent extension is NOT installed\n');
      console.log('Installing unaccent extension...\n');

      await client.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
      console.log('✅ unaccent extension installed!\n');
    }

    // Test unaccent function with Vietnamese
    console.log('Testing unaccent with Vietnamese characters...\n');
    const testQuery = await client.query(`
      SELECT unaccent('NGUYỄN VĂN KIÊN') as result;
    `);

    console.log('Original: NGUYỄN VĂN KIÊN');
    console.log('Unaccented:', testQuery.rows[0].result);
    console.log('\n✅ unaccent works!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

checkExtension().catch(console.error);
