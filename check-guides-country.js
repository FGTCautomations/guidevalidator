// Check guide country distribution
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkCountries() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guide Country Distribution                 ║');
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

    // Total guides count
    const totalQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM guides;
    `);

    console.log(`Total guides: ${totalQuery.rows[0].total}\n`);

    // Count by country
    const countryQuery = await client.query(`
      SELECT country_code, COUNT(*) as count
      FROM guides
      GROUP BY country_code
      ORDER BY count DESC;
    `);

    console.log('Guides by country:\n');
    countryQuery.rows.forEach(row => {
      const country = row.country_code || '(NULL)';
      console.log(`  ${country}: ${row.count}`);
    });

    // Count guides with NULL country
    const nullCountry = countryQuery.rows.find(r => r.country_code === null);
    if (nullCountry) {
      console.log(`\n⚠️  Found ${nullCountry.count} guides with NULL country_code\n`);
      console.log('Setting all guides to VN...\n');

      const updateQuery = await client.query(`
        UPDATE guides
        SET country_code = 'VN'
        WHERE country_code IS NULL;
      `);

      console.log(`✅ Updated guides to VN\n`);

      // Check count again
      const vnQuery = await client.query(`
        SELECT COUNT(*) as count
        FROM guides
        WHERE country_code = 'VN';
      `);

      console.log(`Total guides with country_code = 'VN': ${vnQuery.rows[0].count}\n`);
    } else {
      const vnCount = countryQuery.rows.find(r => r.country_code === 'VN');
      console.log(`\n✅ All guides have country codes`);
      console.log(`Vietnam guides: ${vnCount ? vnCount.count : 0}\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

checkCountries().catch(console.error);
