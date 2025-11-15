// Test the guide profile query
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testQuery() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Guide Profile Query                         ║');
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

    // Get a sample guide ID from guides_browse_v
    const sampleQuery = await client.query(`
      SELECT id, profile_id, name
      FROM guides_browse_v
      LIMIT 1;
    `);

    if (sampleQuery.rows.length > 0) {
      const sample = sampleQuery.rows[0];
      console.log('Sample guide from guides_browse_v:');
      console.log(`  ID: ${sample.id}`);
      console.log(`  Profile ID: ${sample.profile_id}`);
      console.log(`  Name: ${sample.name}\n`);

      // Now try to fetch this guide by its ID (like the profile page does)
      const fetchQuery = await client.query(`
        SELECT
          g.id,
          g.profile_id,
          g.name,
          g.headline,
          p.id as profile_exists,
          p.full_name,
          p.country_code
        FROM guides g
        INNER JOIN profiles p ON g.profile_id = p.id
        WHERE g.id = $1;
      `, [sample.id]);

      if (fetchQuery.rows.length > 0) {
        console.log('✅ Successfully fetched guide by ID:\n');
        const guide = fetchQuery.rows[0];
        console.log(`  Guide ID: ${guide.id}`);
        console.log(`  Profile ID: ${guide.profile_id}`);
        console.log(`  Guide Name: ${guide.name}`);
        console.log(`  Profile Name: ${guide.full_name}`);
        console.log(`  Country: ${guide.country_code}\n`);
      } else {
        console.log('❌ Failed to fetch guide by ID\n');
      }
    } else {
      console.log('❌ No guides found in guides_browse_v\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

testQuery().catch(console.error);
