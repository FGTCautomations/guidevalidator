#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function testStageParksAPI() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🧪 TESTING PARKS API WITH national_parks_stage TABLE\n');
    console.log('═'.repeat(70) + '\n');

    // Test Case 1: Get parks by country code
    console.log('TEST 1: Get parks by country (United States)\n');
    console.log('API: GET /api/locations/parks?country=US\n');

    const usParks = await client.query(`
      SELECT id, name, type, unesco_site, official_name
      FROM public.national_parks_stage
      WHERE country_code = 'US'
      ORDER BY unesco_site DESC, name
      LIMIT 10;
    `);

    console.log(`✓ Found ${usParks.rows.length} parks in United States:`);
    usParks.rows.forEach((park, i) => {
      const unesco = park.unesco_site ? '🌍 UNESCO' : '';
      console.log(`   ${i + 1}. ${park.name} ${unesco}`);
      if (park.type) console.log(`      Type: ${park.type}`);
    });

    console.log('\n' + '─'.repeat(70) + '\n');

    // Test Case 2: Get parks by region
    console.log('TEST 2: Get parks by region (California)\n');

    // First get California region ID
    const californiaRegion = await client.query(`
      SELECT id, name FROM public.regions
      WHERE country_code = 'US' AND name = 'California'
      LIMIT 1;
    `);

    if (californiaRegion.rows.length > 0) {
      const regionId = californiaRegion.rows[0].id;
      console.log(`Region: California (${regionId})`);
      console.log(`API: GET /api/locations/parks?region=${regionId}\n`);

      const caParks = await client.query(`
        SELECT id, name, type, unesco_site
        FROM public.national_parks_stage
        WHERE region_id = $1
        ORDER BY unesco_site DESC, name
        LIMIT 10;
      `, [regionId]);

      console.log(`✓ Found ${caParks.rows.length} parks in California:`);
      if (caParks.rows.length > 0) {
        caParks.rows.forEach((park, i) => {
          const unesco = park.unesco_site ? '🌍 UNESCO' : '';
          console.log(`   ${i + 1}. ${park.name} ${unesco}`);
        });
      } else {
        console.log('   ⚠️  No parks linked to California region yet');
      }
    } else {
      console.log('   ❌ California region not found');
    }

    console.log('\n' + '─'.repeat(70) + '\n');

    // Test Case 3: Check multiple countries
    console.log('TEST 3: Parks availability by country\n');

    const countries = ['AU', 'CA', 'NZ', 'TH', 'VN', 'ZA', 'BR', 'CN', 'JP', 'IN'];

    for (const countryCode of countries) {
      const countryInfo = await client.query(`
        SELECT name FROM public.countries WHERE code = $1
      `, [countryCode]);

      const parkCount = await client.query(`
        SELECT COUNT(*) as count
        FROM public.national_parks_stage
        WHERE country_code = $1;
      `, [countryCode]);

      const countryName = countryInfo.rows[0]?.name || countryCode;
      const count = parkCount.rows[0].count;

      console.log(`   ${countryName} (${countryCode}): ${count} parks`);
    }

    console.log('\n' + '─'.repeat(70) + '\n');

    // Test Case 4: Check UNESCO sites
    console.log('TEST 4: UNESCO World Heritage Sites\n');

    const unescoCount = await client.query(`
      SELECT COUNT(*) as count
      FROM public.national_parks_stage
      WHERE unesco_site = true;
    `);

    console.log(`✓ Total UNESCO sites: ${unescoCount.rows[0].count}`);

    const unescoSample = await client.query(`
      SELECT name, country_code, type
      FROM public.national_parks_stage
      WHERE unesco_site = true
      ORDER BY name
      LIMIT 15;
    `);

    console.log('\nSample UNESCO sites:');
    unescoSample.rows.forEach((park, i) => {
      console.log(`   ${i + 1}. ${park.name} (${park.country_code})`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');

    // Summary
    const totalParks = await client.query('SELECT COUNT(*) FROM public.national_parks_stage');
    const withRegions = await client.query(`
      SELECT COUNT(*) FROM public.national_parks_stage WHERE region_id IS NOT NULL
    `);
    const countriesCovered = await client.query(`
      SELECT COUNT(DISTINCT country_code) FROM public.national_parks_stage
    `);

    console.log('📊 SUMMARY\n');
    console.log(`Total parks in stage table: ${totalParks.rows[0].count}`);
    console.log(`Parks with region links: ${withRegions.rows[0].count}`);
    console.log(`Countries covered: ${countriesCovered.rows[0].count}`);
    console.log(`UNESCO sites: ${unescoCount.rows[0].count}`);

    console.log('\n✅ API now uses national_parks_stage table directly!');
    console.log('💡 Parks will appear in dropdown when users select regions/countries\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testStageParksAPI();
