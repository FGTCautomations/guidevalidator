#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function debugParksResponse() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Test a few countries
    const testCountries = ['AU', 'US', 'CA', 'TH', 'VN'];

    console.log('🔍 DEBUGGING PARKS API RESPONSE\n');
    console.log('═'.repeat(70) + '\n');

    for (const code of testCountries) {
      // Get total in database
      const totalResult = await client.query(`
        SELECT COUNT(*) as count
        FROM public.national_parks_stage
        WHERE country_code = $1;
      `, [code]);

      // Simulate API query (with 10k limit, sorted by UNESCO then name)
      const apiResult = await client.query(`
        SELECT id, name, type, unesco_site, official_name
        FROM public.national_parks_stage
        WHERE country_code = $1
        ORDER BY unesco_site DESC, name
        LIMIT 10000;
      `, [code]);

      const total = parseInt(totalResult.rows[0].count);
      const returned = apiResult.rows.length;

      const countryInfo = await client.query(`
        SELECT name FROM public.countries WHERE code = $1
      `, [code]);

      const countryName = countryInfo.rows[0]?.name || code;

      console.log(`${countryName} (${code}):`);
      console.log(`   Total in database: ${total}`);
      console.log(`   Returned by API: ${returned}`);
      console.log(`   Limit hit: ${returned >= 10000 ? 'YES ⚠️' : 'NO ✓'}`);

      // Show first 5 parks
      console.log(`\n   First 5 parks returned:`);
      apiResult.rows.slice(0, 5).forEach((park, i) => {
        const unesco = park.unesco_site ? '🌍' : '  ';
        const name = park.name.length > 50 ? park.name.substring(0, 50) + '...' : park.name;
        console.log(`      ${i + 1}. ${unesco} ${name}`);
      });

      console.log('\n');
    }

    console.log('═'.repeat(70) + '\n');
    console.log('💡 If "Returned by API" matches what you see in dropdown, the API is working correctly.');
    console.log('   If not, there may be a frontend caching or rendering issue.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

debugParksResponse();
