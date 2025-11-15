// Apply migration using direct PostgreSQL connection
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Guide Search ByteString Fix                ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // PostgreSQL connection config from environment
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
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_fix_guide_search_bytestring.sql');
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

    // Verify function works
    console.log('Testing guide search with Vietnamese characters...\n');
    const testResult = await client.query(`
      SELECT api_guides_search(
        p_country := 'VN',
        p_q := 'NGUYỄN VĂN KIÊN',
        p_limit := 1
      ) as result
    `);

    const result = testResult.rows[0]?.result;
    if (result?.results?.length > 0) {
      console.log('✅ Function working! Found guide:', result.results[0].name);
    } else {
      console.log('⚠️  Function executed but no results found');
    }

    console.log('\n✅ Migration complete!\n');
    console.log('Now testing via Edge Function...\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
