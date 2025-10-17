#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function testParksDropdown() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🧪 TESTING NATIONAL PARKS CASCADING DROPDOWN\n');
    console.log('═'.repeat(70) + '\n');

    // Test scenarios that guides would actually use
    const testCases = [
      {
        name: 'United States → California → Yosemite',
        country: 'US',
        region: 'California',
        expectedPark: 'Yosemite'
      },
      {
        name: 'Australia → Queensland → Great Barrier Reef',
        country: 'AU',
        region: 'Queensland',
        expectedPark: 'Great Barrier Reef'
      },
      {
        name: 'Canada → Alberta → Banff',
        country: 'CA',
        region: 'Alberta',
        expectedPark: 'Banff'
      },
      {
        name: 'Thailand → Surat Thani → Khao Sok',
        country: 'TH',
        region: 'Surat Thani',
        expectedPark: 'Khao Sok'
      },
      {
        name: 'South Africa → Limpopo → Kruger',
        country: 'ZA',
        region: 'Limpopo',
        expectedPark: 'Kruger'
      }
    ];

    for (const test of testCases) {
      console.log(`📍 TEST: ${test.name}`);
      console.log('─'.repeat(70));

      // Step 1: Get region ID
      const regionResult = await client.query(`
        SELECT id, name
        FROM public.regions
        WHERE country_code = $1 AND name ILIKE $2
        LIMIT 1;
      `, [test.country, test.region]);

      if (regionResult.rows.length === 0) {
        console.log(`   ❌ FAIL: Region "${test.region}" not found in ${test.country}\n`);
        continue;
      }

      const region = regionResult.rows[0];
      console.log(`   ✓ Region found: ${region.name} (ID: ${region.id})`);

      // Step 2: Get parks for this region (simulating API call)
      const parksResult = await client.query(`
        SELECT id, name, type, unesco_site
        FROM public.national_parks
        WHERE region_id = $1
        ORDER BY
          unesco_site DESC,
          CASE WHEN name ILIKE '%National Park%' THEN 0 ELSE 1 END,
          name
        LIMIT 10;
      `, [region.id]);

      console.log(`   ✓ Parks loaded: ${parksResult.rows.length} parks available`);

      if (parksResult.rows.length === 0) {
        console.log(`   ⚠️  WARNING: No parks found for region ${region.name}\n`);
        continue;
      }

      // Step 3: Check if expected park is in the list
      const foundPark = parksResult.rows.find(p =>
        p.name.toLowerCase().includes(test.expectedPark.toLowerCase())
      );

      if (foundPark) {
        const unesco = foundPark.unesco_site ? '🌍 UNESCO' : '';
        console.log(`   ✅ SUCCESS: Found "${foundPark.name}" ${unesco}`);
      } else {
        console.log(`   ❌ FAIL: "${test.expectedPark}" not found in parks list`);
      }

      // Show all parks for this region
      console.log(`\n   Available parks in ${region.name}:`);
      parksResult.rows.forEach((park, i) => {
        const unesco = park.unesco_site ? '🌍' : '  ';
        console.log(`      ${i + 1}. ${unesco} ${park.name}`);
      });

      console.log('\n');
    }

    // Summary test: Check API endpoint format
    console.log('═'.repeat(70));
    console.log('\n🔗 API ENDPOINT TESTS\n');

    // Test 1: Get parks by region
    const californiaRegion = await client.query(`
      SELECT id FROM public.regions
      WHERE country_code = 'US' AND name = 'California'
      LIMIT 1;
    `);

    if (californiaRegion.rows.length > 0) {
      const regionId = californiaRegion.rows[0].id;
      console.log(`✓ GET /api/locations/parks?region=${regionId}`);

      const parks = await client.query(`
        SELECT name FROM public.national_parks
        WHERE region_id = $1;
      `, [regionId]);

      console.log(`  Response: ${parks.rows.length} park(s)`);
      parks.rows.forEach(p => console.log(`    - ${p.name}`));
    }

    console.log('');

    // Test 2: Get parks by country (for unlinked parks)
    console.log(`✓ GET /api/locations/parks?country=TZ`);

    const tzParks = await client.query(`
      SELECT name, unesco_site FROM public.national_parks
      WHERE country_code = 'TZ'
      ORDER BY unesco_site DESC, name
      LIMIT 5;
    `);

    console.log(`  Response: ${tzParks.rows.length} park(s) in Tanzania`);
    tzParks.rows.forEach(p => {
      const unesco = p.unesco_site ? '🌍' : '  ';
      console.log(`    ${unesco} ${p.name}`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ ALL TESTS COMPLETE!\n');

    // Final summary
    const summary = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE region_id IS NOT NULL) as linked,
        COUNT(*) FILTER (WHERE unesco_site = true) as unesco,
        COUNT(DISTINCT country_code) as countries
      FROM public.national_parks;
    `);

    const s = summary.rows[0];
    console.log('📊 Database Summary:');
    console.log(`   Total parks: ${s.total}`);
    console.log(`   Countries: ${s.countries}`);
    console.log(`   Linked to regions: ${s.linked} (${((s.linked / s.total) * 100).toFixed(1)}%)`);
    console.log(`   UNESCO sites: ${s.unesco}`);

    console.log('\n💡 Usage in UI:');
    console.log('   1. User selects Country → Regions load');
    console.log('   2. User selects Region(s) → Cities load');
    console.log('   3. User selects Cities → Parks load for selected regions');
    console.log('   4. If parks not linked to region, show all parks in country\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testParksDropdown();
