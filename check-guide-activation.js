// Check guide profile activation status
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkActivation() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guide Profile Activation Status           ║');
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

    // Check profile activation status
    const statusQuery = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE p.id IS NOT NULL) as has_profile,
        COUNT(*) FILTER (WHERE p.id IS NULL) as no_profile,
        COUNT(*) FILTER (WHERE au.id IS NOT NULL) as has_auth_user,
        COUNT(*) FILTER (WHERE au.id IS NULL) as no_auth_user
      FROM guides g
      LEFT JOIN profiles p ON g.profile_id = p.id
      LEFT JOIN auth.users au ON p.id = au.id;
    `);

    const stats = statusQuery.rows[0];
    console.log('Guide Profile Status:\n');
    console.log(`  Guides with profile record: ${stats.has_profile}`);
    console.log(`  Guides without profile record: ${stats.no_profile}`);
    console.log(`  Guides with auth user (activated): ${stats.has_auth_user}`);
    console.log(`  Guides without auth user (not activated): ${stats.no_auth_user}\n`);

    // Sample some guides without auth users
    const sampleQuery = await client.query(`
      SELECT
        g.id as guide_id,
        g.profile_id,
        g.name as guide_name,
        p.full_name as profile_name,
        au.email,
        au.created_at as auth_created_at
      FROM guides g
      INNER JOIN profiles p ON g.profile_id = p.id
      LEFT JOIN auth.users au ON p.id = au.id
      WHERE au.id IS NULL
      LIMIT 5;
    `);

    if (sampleQuery.rows.length > 0) {
      console.log('Sample guides without activated profiles:\n');
      sampleQuery.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.guide_name}`);
        console.log(`   Guide ID: ${row.guide_id}`);
        console.log(`   Profile ID: ${row.profile_id}`);
        console.log(`   Has auth user: NO\n`);
      });
    } else {
      console.log('✅ All guides have activated profiles!\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkActivation().catch(console.error);
