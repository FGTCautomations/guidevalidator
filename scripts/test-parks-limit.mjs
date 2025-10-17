#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function testParksLimit() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🧪 TESTING PARKS API LIMIT\n');
    console.log('═'.repeat(70) + '\n');

    // Test countries with lots of parks
    const testCountries = [
      { code: 'AU', name: 'Australia' },
      { code: 'CA', name: 'Canada' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'JP', name: 'Japan' }
    ];

    for (const country of testCountries) {
      // Get total count
      const totalCount = await client.query(`
        SELECT COUNT(*) as count
        FROM public.national_parks_stage
        WHERE country_code = $1;
      `, [country.code]);

      // Get what API would return (limit 1000)
      const apiResult = await client.query(`
        SELECT id, name
        FROM public.national_parks_stage
        WHERE country_code = $1
        ORDER BY unesco_site DESC, name
        LIMIT 1000;
      `, [country.code]);

      const total = parseInt(totalCount.rows[0].count);
      const returned = apiResult.rows.length;
      const percentage = ((returned / total) * 100).toFixed(1);

      console.log(`${country.name} (${country.code}):`);
      console.log(`   Total parks in database: ${total}`);
      console.log(`   Returned by API (limit 1000): ${returned}`);
      console.log(`   Coverage: ${percentage}%`);

      if (returned < total) {
        console.log(`   ⚠️  ${total - returned} parks NOT shown (exceeds limit)`);
      } else {
        console.log(`   ✅ All parks will be shown`);
      }
      console.log('');
    }

    console.log('═'.repeat(70) + '\n');
    console.log('💡 Summary:\n');
    console.log('Current API limit: 1000 parks per country');
    console.log('- For most countries, all parks will be shown');
    console.log('- For countries with >1000 parks, only first 1000 will show');
    console.log('\n✅ Parks dropdown updated to show up to 1000 parks per country!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testParksLimit();
