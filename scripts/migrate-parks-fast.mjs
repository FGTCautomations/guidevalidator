#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function migrateParks() {
  const client = new Client({ connectionString });

  try {
    console.log('🌳 Migrating parks from stage table...\n');
    await client.connect();

    // First, get valid country codes
    const validCountries = await client.query('SELECT code FROM public.countries');
    const countryCodes = validCountries.rows.map(r => r.code);
    console.log(`✓ Found ${countryCodes.length} valid country codes\n`);

    // Use SQL to do bulk insert - much faster than row by row
    console.log('🚀 Performing bulk migration with SQL...\n');

    const result = await client.query(`
      INSERT INTO public.national_parks (
        country_code,
        region_id,
        name,
        official_name,
        type,
        area_km2,
        established_year,
        unesco_site,
        latitude,
        longitude,
        description,
        created_at,
        updated_at
      )
      SELECT
        nps.country_code,
        nps.region_id,
        nps.name,
        nps.official_name,
        nps.type,
        nps.area_km2,
        nps.established_year,
        nps.unesco_site,
        nps.latitude,
        nps.longitude,
        nps.description,
        NOW(),
        NOW()
      FROM public.national_parks_stage nps
      WHERE
        -- Only include parks with valid country codes
        nps.country_code IN (SELECT code FROM public.countries)
        -- Filter for major/important parks
        AND (
          nps.unesco_site = true
          OR nps.type ILIKE '%National Park%'
          OR nps.type ILIKE '%Marine Park%'
          OR nps.type ILIKE '%Nature Reserve%'
          OR nps.type ILIKE '%Wildlife Sanctuary%'
          OR nps.area_km2 > 100
          OR nps.name ILIKE '%National Park%'
          OR nps.name ILIKE '%Marine Park%'
        )
        -- Don't insert duplicates
        AND NOT EXISTS (
          SELECT 1 FROM public.national_parks np
          WHERE np.country_code = nps.country_code
          AND np.name = nps.name
        )
      ORDER BY
        nps.unesco_site DESC,
        nps.area_km2 DESC NULLS LAST
      LIMIT 3000;
    `);

    console.log(`✅ Inserted ${result.rowCount} parks!\n`);

    // Final stats
    const totalParks = await client.query('SELECT COUNT(*) FROM public.national_parks');
    const withRegions = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE region_id IS NOT NULL');
    const unescoSites = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE unesco_site = true');

    console.log('📊 Database totals:');
    console.log(`   Total parks: ${totalParks.rows[0].count}`);
    console.log(`   With regions: ${withRegions.rows[0].count}`);
    console.log(`   UNESCO sites: ${unescoSites.rows[0].count}`);

    // Show parks by country (top 20)
    const byCountry = await client.query(`
      SELECT
        c.name as country_name,
        np.country_code,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE np.unesco_site = true) as unesco_count
      FROM public.national_parks np
      JOIN public.countries c ON c.code = np.country_code
      GROUP BY c.name, np.country_code
      ORDER BY count DESC
      LIMIT 20;
    `);

    console.log('\n🌍 Top 20 countries by park count:');
    byCountry.rows.forEach(row => {
      const unescoNote = row.unesco_count > 0 ? ` (${row.unesco_count} UNESCO)` : '';
      console.log(`   ${row.country_name} (${row.country_code}): ${row.count} parks${unescoNote}`);
    });

    // Show some notable UNESCO sites
    const unescoSamples = await client.query(`
      SELECT name, country_code, type, area_km2
      FROM public.national_parks
      WHERE unesco_site = true
      ORDER BY area_km2 DESC NULLS LAST
      LIMIT 15;
    `);

    console.log('\n🌍 Sample UNESCO World Heritage Sites (largest):');
    unescoSamples.rows.forEach(park => {
      const area = park.area_km2 ? ` - ${park.area_km2.toLocaleString()} km²` : '';
      console.log(`   - ${park.name} (${park.country_code})${area}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateParks();
