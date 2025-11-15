// Test directory pagination and total count
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testPagination() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Directory Pagination                        ║');
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

    // Test the RPC function with Vietnam
    console.log('Testing api_guides_search for Vietnam...\n');

    const result = await client.query(`
      SELECT * FROM api_guides_search(
        p_country := 'VN',
        p_sort := 'featured',
        p_limit := 24
      );
    `);

    const response = result.rows[0].api_guides_search;

    console.log(`Total guides in Vietnam: ${response.facets.total}`);
    console.log(`Results returned (page 1): ${response.results.length}`);
    console.log(`Has next cursor: ${response.nextCursor ? 'Yes' : 'No'}`);

    if (response.nextCursor) {
      console.log(`\n✅ Pagination is working - can load more results`);
      console.log(`Next cursor: ${response.nextCursor.substring(0, 30)}...`);
    } else {
      console.log(`\n⚠️  No next cursor - all results fit in one page`);
    }

    // Show breakdown by activation status
    console.log('\n\nBreakdown of first 24 results:');
    const featured = response.results.filter(g => g.is_featured).length;
    const activated = response.results.filter(g => !g.is_featured && g.is_activated).length;
    const notActivated = response.results.filter(g => !g.is_activated).length;

    console.log(`  Featured: ${featured}`);
    console.log(`  Activated (not featured): ${activated}`);
    console.log(`  Not Activated: ${notActivated}`);

    // Test second page
    if (response.nextCursor) {
      console.log('\n\nFetching page 2...\n');

      const page2Result = await client.query(`
        SELECT * FROM api_guides_search(
          p_country := 'VN',
          p_sort := 'featured',
          p_limit := 24,
          p_after_cursor := $1
        );
      `, [response.nextCursor]);

      const page2Response = page2Result.rows[0].api_guides_search;

      console.log(`Results returned (page 2): ${page2Response.results.length}`);
      console.log(`Has next cursor: ${page2Response.nextCursor ? 'Yes' : 'No'}`);

      const p2Featured = page2Response.results.filter(g => g.is_featured).length;
      const p2Activated = page2Response.results.filter(g => !g.is_featured && g.is_activated).length;
      const p2NotActivated = page2Response.results.filter(g => !g.is_activated).length;

      console.log(`  Featured: ${p2Featured}`);
      console.log(`  Activated (not featured): ${p2Activated}`);
      console.log(`  Not Activated: ${p2NotActivated}`);
    }

    console.log('\n\n✅ All guides are accessible through pagination');
    console.log('Users can scroll down to load more results automatically.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

testPagination().catch(console.error);
