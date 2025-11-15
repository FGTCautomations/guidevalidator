// Check profiles table for country information
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkProfiles() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Profiles Country Distribution              ║');
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

    // Check if profiles has country_code
    const columnsQuery = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name LIKE '%country%';
    `);

    console.log('Country-related columns in profiles:\n');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Count profiles by country
    const countryQuery = await client.query(`
      SELECT country_code, COUNT(*) as count
      FROM profiles
      WHERE role = 'guide'
      GROUP BY country_code
      ORDER BY count DESC;
    `);

    console.log('\nProfiles with role=guide by country:\n');
    countryQuery.rows.forEach(row => {
      const country = row.country_code || '(NULL)';
      console.log(`  ${country}: ${row.count}`);
    });

    // Check for NULL country codes
    const nullCountry = countryQuery.rows.find(r => r.country_code === null);
    if (nullCountry) {
      console.log(`\n⚠️  Found ${nullCountry.count} guide profiles with NULL country_code\n`);
      console.log('Setting all guide profiles to VN...\n');

      const updateQuery = await client.query(`
        UPDATE profiles
        SET country_code = 'VN'
        WHERE role = 'guide' AND country_code IS NULL;
      `);

      console.log(`✅ Updated guide profiles to VN\n`);

      // Check count again
      const vnQuery = await client.query(`
        SELECT COUNT(*) as count
        FROM profiles
        WHERE role = 'guide' AND country_code = 'VN';
      `);

      console.log(`Total guide profiles with country_code = 'VN': ${vnQuery.rows[0].count}\n`);
    } else {
      const vnCount = countryQuery.rows.find(r => r.country_code === 'VN');
      console.log(`\n✅ All guide profiles have country codes`);
      console.log(`Vietnam guide profiles: ${vnCount ? vnCount.count : 0}\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkProfiles().catch(console.error);
