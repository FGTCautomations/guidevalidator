// Sync avatar_url and image_url in guides table
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function syncImages() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Sync Guide Avatar and Image URLs                 ║');
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

    // Check current status
    const statusQuery = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(avatar_url) as has_avatar,
        COUNT(image_url) as has_image,
        COUNT(CASE WHEN avatar_url IS NOT NULL AND image_url IS NOT NULL THEN 1 END) as has_both,
        COUNT(CASE WHEN avatar_url IS NULL AND image_url IS NULL THEN 1 END) as has_none
      FROM guides;
    `);

    const stats = statusQuery.rows[0];
    console.log('Current status:\n');
    console.log(`  Total guides: ${stats.total}`);
    console.log(`  Has avatar_url: ${stats.has_avatar}`);
    console.log(`  Has image_url: ${stats.has_image}`);
    console.log(`  Has both: ${stats.has_both}`);
    console.log(`  Has none: ${stats.has_none}\n`);

    // Strategy: Prioritize image_url (from imports), fall back to avatar_url
    console.log('Syncing images...\n');

    // Update avatar_url from image_url where avatar_url is null but image_url exists
    const update1 = await client.query(`
      UPDATE guides
      SET avatar_url = image_url
      WHERE image_url IS NOT NULL
        AND image_url != ''
        AND (avatar_url IS NULL OR avatar_url = '');
    `);

    console.log(`Updated ${update1.rowCount} guides: avatar_url ← image_url\n`);

    // Update image_url from avatar_url where image_url is null but avatar_url exists
    const update2 = await client.query(`
      UPDATE guides
      SET image_url = avatar_url
      WHERE avatar_url IS NOT NULL
        AND avatar_url != ''
        AND (image_url IS NULL OR image_url = '');
    `);

    console.log(`Updated ${update2.rowCount} guides: image_url ← avatar_url\n`);

    // Check final status
    const finalQuery = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(avatar_url) as has_avatar,
        COUNT(image_url) as has_image,
        COUNT(CASE WHEN avatar_url IS NOT NULL AND image_url IS NOT NULL THEN 1 END) as has_both,
        COUNT(CASE WHEN avatar_url IS NULL AND image_url IS NULL THEN 1 END) as has_none,
        COUNT(CASE WHEN avatar_url = image_url THEN 1 END) as matching
      FROM guides;
    `);

    const finalStats = finalQuery.rows[0];
    console.log('Final status:\n');
    console.log(`  Total guides: ${finalStats.total}`);
    console.log(`  Has avatar_url: ${finalStats.has_avatar}`);
    console.log(`  Has image_url: ${finalStats.has_image}`);
    console.log(`  Has both: ${finalStats.has_both}`);
    console.log(`  Has none: ${finalStats.has_none}`);
    console.log(`  Matching values: ${finalStats.matching}\n`);

    console.log('✅ Image sync complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

syncImages().catch(console.error);
