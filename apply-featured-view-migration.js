// Apply featured and activated fields migration to guides_browse_v
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Featured & Activated View Migration       ║');
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

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_add_featured_and_activated_to_guides_view.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Test the view with a sample query
    console.log('Testing guides_browse_v with new fields...\n');
    const testQuery = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
        COUNT(*) FILTER (WHERE is_activated = true) as activated_count,
        COUNT(*) FILTER (WHERE is_activated = false) as not_activated_count,
        COUNT(*) as total_count
      FROM guides_browse_v;
    `);

    const stats = testQuery.rows[0];
    console.log('Directory Statistics:');
    console.log(`  Featured profiles: ${stats.featured_count}`);
    console.log(`  Activated profiles: ${stats.activated_count}`);
    console.log(`  Not activated profiles: ${stats.not_activated_count}`);
    console.log(`  Total profiles: ${stats.total_count}\n`);

    // Show sample of ordering
    console.log('Sample ordering (first 10 guides):\n');
    const sampleQuery = await client.query(`
      SELECT name, is_featured, is_activated
      FROM guides_browse_v
      ORDER BY is_featured DESC, is_activated DESC, name ASC
      LIMIT 10;
    `);

    sampleQuery.rows.forEach((row, i) => {
      const status = row.is_featured ? '⭐ Featured' : (row.is_activated ? '✓ Activated' : '○ Not Activated');
      console.log(`  ${i + 1}. ${row.name} - ${status}`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
