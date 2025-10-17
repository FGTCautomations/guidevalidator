#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

// Fetch data from REST Countries API using fetch (Node 18+)
async function fetchCountries() {
  const response = await fetch('https://restcountries.com/v3.1/all');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function populateCountries() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    console.log('🌍 Fetching all countries from REST Countries API...');
    const countriesData = await fetchCountries();

    if (!countriesData || !Array.isArray(countriesData)) {
      console.error('❌ Failed to fetch countries data:', countriesData);
      throw new Error('Invalid response from REST Countries API');
    }

    console.log(`✅ Fetched ${countriesData.length} countries\n`);

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('🚀 Populating countries table...\n');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const country of countriesData) {
      try {
        const code = country.cca2; // ISO 3166-1 alpha-2
        const name = country.name.common;
        const officialName = country.name.official;
        const region = country.region || null;
        const subregion = country.subregion || null;
        const population = country.population || null;
        const area = country.area || null;
        const capital = country.capital ? country.capital[0] : null;
        const currencies = country.currencies ? Object.values(country.currencies)[0] : null;
        const currencyCode = currencies ? Object.keys(country.currencies)[0] : null;
        const currencyName = currencies ? currencies.name : null;
        const phoneCode = country.idd?.root ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}` : null;
        const flagEmoji = country.flag || null;

        // Check if country exists
        const existingCountry = await client.query(
          'SELECT code FROM public.countries WHERE code = $1',
          [code]
        );

        if (existingCountry.rows.length > 0) {
          // Update existing country with new data
          await client.query(`
            UPDATE public.countries
            SET
              name = $2,
              official_name = $3,
              region = $4,
              subregion = $5,
              population = $6,
              area_km2 = $7,
              capital = $8,
              currency_code = $9,
              currency_name = $10,
              phone_code = $11,
              flag_emoji = $12,
              updated_at = NOW()
            WHERE code = $1
          `, [code, name, officialName, region, subregion, population, area, capital, currencyCode, currencyName, phoneCode, flagEmoji]);

          updated++;
          console.log(`   ✓ Updated: ${code} - ${name}`);
        } else {
          // Insert new country
          await client.query(`
            INSERT INTO public.countries (
              code, name, official_name, region, subregion, population,
              area_km2, capital, currency_code, currency_name, phone_code,
              flag_emoji, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          `, [code, name, officialName, region, subregion, population, area, capital, currencyCode, currencyName, phoneCode, flagEmoji]);

          inserted++;
          console.log(`   ✓ Inserted: ${code} - ${name}`);
        }

      } catch (error) {
        skipped++;
        console.log(`   ✗ Skipped: ${country.name?.common || 'Unknown'} - ${error.message}`);
      }
    }

    console.log(`\n✅ Population complete!`);
    console.log(`   📊 Inserted: ${inserted}`);
    console.log(`   📊 Updated: ${updated}`);
    console.log(`   📊 Skipped: ${skipped}`);
    console.log(`   📊 Total: ${inserted + updated} countries in database\n`);

    // Verify count
    const countResult = await client.query('SELECT COUNT(*) FROM public.countries');
    console.log(`✅ Database now has ${countResult.rows[0].count} countries\n`);

    // Show sample
    const sampleResult = await client.query(`
      SELECT code, name, region, capital, flag_emoji
      FROM public.countries
      ORDER BY name
      LIMIT 10
    `);

    console.log('📋 Sample countries:');
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.flag_emoji || '🏳️'} ${row.code} - ${row.name} (${row.region || 'N/A'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateCountries();
