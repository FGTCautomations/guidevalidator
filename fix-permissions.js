// Add service_role permissions to api_guides_search
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixPermissions() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Fix Guide Search Permissions                     ║');
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
    console.log('✅ Connected to database\n');

    // Grant permissions to service_role and authenticator
    const sql = `
      GRANT EXECUTE ON FUNCTION api_guides_search TO anon, authenticated, service_role, authenticator;
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, authenticator;
    `;

    console.log('Granting permissions...\n');
    await client.query(sql);
    console.log('✅ Permissions granted!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fixPermissions().catch(console.error);
