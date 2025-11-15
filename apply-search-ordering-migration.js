// Apply search ordering migration to prioritize Featured and Activated profiles
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Search Ordering Migration                 ║');
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
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_update_guides_search_featured_ordering.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Test search with sort=featured to verify ordering
    console.log('Testing directory search ordering...\n');

    // We need to call the RPC function directly
    const testQuery = await client.query(`
      SELECT * FROM api_guides_search(
        p_country := 'VN',
        p_sort := 'featured',
        p_limit := 10
      );
    `);

    const response = testQuery.rows[0].api_guides_search;

    console.log(`Total guides found: ${response.facets.total}`);
    console.log('\nFirst 10 results (should show Featured → Activated → Not Activated):\n');

    response.results.slice(0, 10).forEach((guide, i) => {
      const status = guide.is_featured ? '⭐ Featured' : (guide.is_activated ? '✓ Activated' : '○ Not Activated');
      console.log(`  ${i + 1}. ${guide.name} - ${status}`);
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
