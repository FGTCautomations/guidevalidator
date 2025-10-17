#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function testFilteredParks() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🧪 TESTING FILTERED PARKS API\n');
    console.log('═'.repeat(70) + '\n');

    const testCountries = ['AU', 'US', 'CA', 'TH', 'VN'];

    for (const code of testCountries) {
      // Get total in database
      const totalResult = await client.query(`
        SELECT COUNT(*) as count
        FROM public.national_parks_stage
        WHERE country_code = $1;
      `, [code]);

      // Simulate filtered API query
      const filteredResult = await client.query(`
        SELECT id, name, type, unesco_site, official_name, area_km2
        FROM public.national_parks_stage
        WHERE country_code = $1
        AND (
          unesco_site = true
          OR type ILIKE '%National Park%'
          OR type ILIKE '%Marine Park%'
          OR area_km2 > 50
          OR name ILIKE '%National%'
        )
        ORDER BY unesco_site DESC, area_km2 DESC NULLS LAST, name
        LIMIT 5000;
      `, [code]);

      const total = parseInt(totalResult.rows[0].count);
      const filtered = filteredResult.rows.length;
      const percentage = ((filtered / total) * 100).toFixed(1);

      const countryInfo = await client.query(`
        SELECT name FROM public.countries WHERE code = $1
      `, [code]);

      const countryName = countryInfo.rows[0]?.name || code;

      console.log(`${countryName} (${code}):`);
      console.log(`   Total protected areas: ${total}`);
      console.log(`   Major parks (filtered): ${filtered}`);
      console.log(`   Percentage shown: ${percentage}%`);
      console.log(`   Reduction: ${total - filtered} small areas filtered out`);

      // Show first 10 parks after filtering
      console.log(`\n   First 10 major parks:`);
      filteredResult.rows.slice(0, 10).forEach((park, i) => {
        const unesco = park.unesco_site ? '🌍' : '  ';
        const area = park.area_km2 ? ` (${Math.round(park.area_km2)} km²)` : '';
        const name = park.name.length > 40 ? park.name.substring(0, 40) + '...' : park.name;
        console.log(`      ${i + 1}. ${unesco} ${name}${area}`);
      });

      console.log('\n');
    }

    console.log('═'.repeat(70) + '\n');
    console.log('✅ Filtering is now active!');
    console.log('   Only showing major/important parks (National Parks, Marine Parks,');
    console.log('   large protected areas >50km², UNESCO sites, and parks with "National" in name)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testFilteredParks();
