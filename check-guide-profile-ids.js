// Check for guides with invalid profile_ids
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkProfileIds() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guide Profile IDs                          ║');
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

    // Check total guides
    const totalQuery = await client.query(`
      SELECT COUNT(*) as count FROM guides;
    `);
    console.log(`Total guides: ${totalQuery.rows[0].count}\n`);

    // Check guides with NULL profile_id
    const nullQuery = await client.query(`
      SELECT COUNT(*) as count
      FROM guides
      WHERE profile_id IS NULL;
    `);
    console.log(`Guides with NULL profile_id: ${nullQuery.rows[0].count}\n`);

    // Check guides with profile_id that doesn't exist in profiles table
    const invalidQuery = await client.query(`
      SELECT COUNT(*) as count
      FROM guides g
      LEFT JOIN profiles p ON g.profile_id = p.id
      WHERE p.id IS NULL;
    `);
    console.log(`Guides with invalid profile_id (not in profiles): ${invalidQuery.rows[0].count}\n`);

    // Sample 5 guides with their profile_id and matching profile info
    const sampleQuery = await client.query(`
      SELECT
        g.profile_id,
        g.name as guide_name,
        p.id as profile_exists,
        p.full_name as profile_name,
        p.role as profile_role
      FROM guides g
      LEFT JOIN profiles p ON g.profile_id = p.id
      LIMIT 5;
    `);

    console.log('Sample guides:\n');
    sampleQuery.rows.forEach((row, i) => {
      console.log(`${i + 1}. Guide: ${row.guide_name}`);
      console.log(`   Profile ID: ${row.profile_id}`);
      console.log(`   Profile exists: ${row.profile_exists ? 'YES' : 'NO'}`);
      if (row.profile_exists) {
        console.log(`   Profile name: ${row.profile_name}`);
        console.log(`   Profile role: ${row.profile_role}`);
      }
      console.log('');
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkProfileIds().catch(console.error);
