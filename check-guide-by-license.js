// Check specific guides by license number
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkGuides() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guides by License Number                  ║');
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

    const licenses = ['252190376', '272250199'];

    for (const license of licenses) {
      console.log(`\n📋 Checking guide with license: ${license}\n`);

      // Get guide info
      const guideQuery = await client.query(`
        SELECT
          g.id,
          g.profile_id,
          g.name,
          g.license_number,
          p.id as profile_exists,
          p.role,
          p.country_code
        FROM guides g
        LEFT JOIN profiles p ON g.profile_id = p.id
        WHERE g.license_number = $1;
      `, [license]);

      if (guideQuery.rows.length === 0) {
        console.log(`  ❌ Guide not found with license ${license}\n`);
        continue;
      }

      const guide = guideQuery.rows[0];
      console.log(`  Guide ID: ${guide.id}`);
      console.log(`  Profile ID: ${guide.profile_id}`);
      console.log(`  Name: ${guide.name}`);
      console.log(`  License: ${guide.license_number}`);
      console.log(`  Profile exists: ${guide.profile_exists ? 'Yes' : 'No'}`);
      console.log(`  Role: ${guide.role || '(none)'}`);

      // Check if there's an auth user for this profile_id
      const authQuery = await client.query(`
        SELECT id, email, created_at
        FROM auth.users
        WHERE id = $1;
      `, [guide.profile_id]);

      console.log(`  Auth user exists: ${authQuery.rows.length > 0 ? 'Yes' : 'No'}`);

      if (authQuery.rows.length > 0) {
        console.log(`  Auth email: ${authQuery.rows[0].email}`);
        console.log(`  Auth created: ${authQuery.rows[0].created_at}`);
      }

      // Check guides_browse_v
      const viewQuery = await client.query(`
        SELECT id, name, is_activated, is_featured
        FROM guides_browse_v
        WHERE id = $1;
      `, [guide.id]);

      if (viewQuery.rows.length > 0) {
        const viewData = viewQuery.rows[0];
        console.log(`  In guides_browse_v: Yes`);
        console.log(`  is_activated: ${viewData.is_activated}`);
        console.log(`  is_featured: ${viewData.is_featured}`);
      } else {
        console.log(`  In guides_browse_v: No`);
      }

      console.log('');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkGuides().catch(console.error);
