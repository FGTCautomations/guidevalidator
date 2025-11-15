// Create guides_browse_v view
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Create guides_browse_v View                      ║');
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
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_create_guides_browse_view.sql');
    console.log('Reading migration file...\n');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Connect to database
    console.log('Connecting to production database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Execute migration
    console.log('Creating guides_browse_v view...\n');
    await client.query(sql);
    console.log('✅ View created successfully!\n');

    // Test the view
    console.log('Testing view...\n');
    const testQuery = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT country_code) as countries
      FROM guides_browse_v;
    `);

    console.log(`Total guides in view: ${testQuery.rows[0].total}`);
    console.log(`Countries: ${testQuery.rows[0].countries}\n`);

    // Count by country
    const countryQuery = await client.query(`
      SELECT country_code, COUNT(*) as count
      FROM guides_browse_v
      GROUP BY country_code
      ORDER BY count DESC;
    `);

    console.log('Guides by country:\n');
    countryQuery.rows.forEach(row => {
      console.log(`  ${row.country_code}: ${row.count}`);
    });

    console.log('\n✅ View is working!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
