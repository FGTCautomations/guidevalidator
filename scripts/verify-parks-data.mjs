#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function verifyParksData() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🔍 Verifying National Parks Data\n');
    console.log('═'.repeat(60) + '\n');

    // 1. Check UNESCO sites
    const unescoCount = await client.query(`
      SELECT COUNT(*) FROM public.national_parks WHERE unesco_site = true;
    `);

    console.log('🌍 UNESCO World Heritage Sites:');
    console.log(`   Count: ${unescoCount.rows[0].count}`);

    if (parseInt(unescoCount.rows[0].count) > 0) {
      const unescoSites = await client.query(`
        SELECT name, country_code, type
        FROM public.national_parks
        WHERE unesco_site = true
        ORDER BY country_code, name
        LIMIT 20;
      `);

      console.log('\n   Sample UNESCO sites:');
      unescoSites.rows.forEach(park => {
        console.log(`   - ${park.name} (${park.country_code})`);
      });
    }

    // 2. Check parks by type
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Parks by Type:\n');

    const byType = await client.query(`
      SELECT type, COUNT(*) as count
      FROM public.national_parks
      WHERE type IS NOT NULL
      GROUP BY type
      ORDER BY count DESC
      LIMIT 15;
    `);

    byType.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.count}`);
    });

    // 3. Check major parks in key countries
    console.log('\n' + '═'.repeat(60));
    console.log('\n🌏 Sample Parks by Country:\n');

    const countries = ['US', 'AU', 'CA', 'NZ', 'ZA', 'BR', 'CN', 'JP', 'TH', 'VN'];

    for (const countryCode of countries) {
      const parks = await client.query(`
        SELECT name, type, region_id
        FROM public.national_parks
        WHERE country_code = $1
        ORDER BY
          CASE WHEN name ILIKE '%National Park%' THEN 0 ELSE 1 END,
          name
        LIMIT 5;
      `, [countryCode]);

      if (parks.rows.length > 0) {
        const countryName = await client.query('SELECT name FROM public.countries WHERE code = $1', [countryCode]);
        console.log(`\n${countryName.rows[0]?.name || countryCode}:`);
        parks.rows.forEach(park => {
          const regionNote = park.region_id ? '🔗' : '  ';
          console.log(`   ${regionNote} ${park.name}`);
        });
      }
    }

    // 4. Check for well-known parks
    console.log('\n' + '═'.repeat(60));
    console.log('\n🔍 Searching for Well-Known Parks:\n');

    const famousParks = [
      { name: 'Yellowstone', country: 'US' },
      { name: 'Yosemite', country: 'US' },
      { name: 'Grand Canyon', country: 'US' },
      { name: 'Banff', country: 'CA' },
      { name: 'Kruger', country: 'ZA' },
      { name: 'Great Barrier Reef', country: 'AU' },
      { name: 'Serengeti', country: 'TZ' },
      { name: 'Torres del Paine', country: 'CL' },
    ];

    for (const park of famousParks) {
      const result = await client.query(`
        SELECT name, type, region_id, unesco_site
        FROM public.national_parks
        WHERE country_code = $1
        AND name ILIKE '%' || $2 || '%'
        LIMIT 1;
      `, [park.country, park.name]);

      if (result.rows.length > 0) {
        const p = result.rows[0];
        const linked = p.region_id ? '🔗' : '❌';
        const unesco = p.unesco_site ? '🌍' : '  ';
        console.log(`   ✓ ${p.name} (${park.country}) ${linked} ${unesco}`);
      } else {
        console.log(`   ✗ ${park.name} (${park.country}) - NOT FOUND`);
      }
    }

    // 5. Summary statistics
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Summary Statistics:\n');

    const stats = await client.query(`
      SELECT
        COUNT(*) as total_parks,
        COUNT(region_id) as with_regions,
        COUNT(*) FILTER (WHERE unesco_site = true) as unesco_sites,
        COUNT(*) FILTER (WHERE type ILIKE '%National Park%') as national_parks,
        COUNT(*) FILTER (WHERE area_km2 IS NOT NULL) as with_area,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL) as with_coords,
        COUNT(DISTINCT country_code) as countries_covered
      FROM public.national_parks;
    `);

    const s = stats.rows[0];
    console.log(`   Total Parks: ${s.total_parks}`);
    console.log(`   Countries Covered: ${s.countries_covered}`);
    console.log(`   With Regions: ${s.with_regions} (${((s.with_regions / s.total_parks) * 100).toFixed(1)}%)`);
    console.log(`   UNESCO Sites: ${s.unesco_sites}`);
    console.log(`   National Parks: ${s.national_parks}`);
    console.log(`   With Area Data: ${s.with_area}`);
    console.log(`   With Coordinates: ${s.with_coords}`);

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyParksData();
