// Apply pagination fix migration
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyFix() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Pagination Fix                            ║');
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

    // Read migration
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_fix_guides_search_pagination.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying pagination fix...\n');
    await client.query(migrationSQL);
    console.log('✅ Pagination fix applied\n');

    // Test pagination
    console.log('Testing pagination...\n');

    const page1 = await client.query(`
      SELECT * FROM api_guides_search(
        p_country := 'VN',
        p_sort := 'featured',
        p_limit := 24
      );
    `);

    const response1 = page1.rows[0].api_guides_search;
    console.log(`Page 1: ${response1.results.length} results`);
    console.log(`Total: ${response1.facets.total}`);
    console.log(`Has cursor: ${response1.nextCursor ? 'Yes' : 'No'}\n`);

    if (response1.nextCursor) {
      const page2 = await client.query(`
        SELECT * FROM api_guides_search(
          p_country := 'VN',
          p_sort := 'featured',
          p_limit := 24,
          p_after_cursor := $1
        );
      `, [response1.nextCursor]);

      const response2 = page2.rows[0].api_guides_search;
      console.log(`Page 2: ${response2.results.length} results`);
      console.log(`Has cursor: ${response2.nextCursor ? 'Yes' : 'No'}\n`);

      if (response2.results.length > 0) {
        console.log('✅ Pagination is now working correctly!\n');
        console.log('Sample from page 2:');
        response2.results.slice(0, 3).forEach((g, i) => {
          const status = g.is_featured ? '⭐ Featured' : (g.is_activated ? '✓ Activated' : '○ Not Activated');
          console.log(`  ${i + 1}. ${g.name} - ${status}`);
        });
      } else {
        console.log('⚠️  Page 2 still empty - issue not resolved');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix().catch(console.error);
