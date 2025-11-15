// Apply license number search migration
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply License Number Search Migration            ║');
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
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_add_license_search.sql');
    console.log('Reading migration file...\n');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Connect to database
    console.log('Connecting to production database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Execute migration
    console.log('Executing migration SQL...\n');
    await client.query(sql);
    console.log('✅ Migration applied successfully!\n');

    // Get a sample license number to test
    const sampleQuery = await client.query(`
      SELECT license_number
      FROM guides
      WHERE license_number IS NOT NULL AND license_number != ''
      LIMIT 1
    `);

    if (sampleQuery.rows.length > 0) {
      const sampleLicense = sampleQuery.rows[0].license_number;
      console.log(`Testing search with license number: ${sampleLicense}\n`);

      // Test the function with license number
      const testResult = await client.query(`
        SELECT api_guides_search(
          p_country := 'VN',
          p_q := $1,
          p_limit := 5
        ) as result
      `, [sampleLicense]);

      const result = testResult.rows[0]?.result;
      if (result?.results?.length > 0) {
        console.log('✅ License search working! Found guides:');
        result.results.forEach((guide, i) => {
          console.log(`  ${i + 1}. ${guide.name}`);
        });
        console.log(`\nTotal results: ${result.results.length}`);
      } else {
        console.log('⚠️  No results found for this license number');
      }
    } else {
      console.log('⚠️  No guides with license numbers found for testing');
    }

    console.log('\n✅ Migration complete!\n');
    console.log('Now you can search by:\n');
    console.log('  - Name (with or without accents)');
    console.log('  - Headline');
    console.log('  - License number\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
