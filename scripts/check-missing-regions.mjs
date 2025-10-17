#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function checkMissingRegions() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all unlinked cities
    const unlinkedCities = await client.query(`
      SELECT name, country_code
      FROM cities
      WHERE region_id IS NULL
      ORDER BY country_code, name
    `);

    console.log(`Found ${unlinkedCities.rows.length} unlinked cities\n`);
    console.log('='.repeat(80));

    // Group by country
    const byCountry = {};
    for (const city of unlinkedCities.rows) {
      if (!byCountry[city.country_code]) {
        byCountry[city.country_code] = [];
      }
      byCountry[city.country_code].push(city.name);
    }

    // For each country, show cities and available regions
    for (const [countryCode, cities] of Object.entries(byCountry)) {
      console.log(`\n${countryCode} - ${cities.length} unlinked cities:`);
      console.log('-'.repeat(80));
      cities.forEach(city => console.log(`  - ${city}`));

      // Get all regions for this country
      const regions = await client.query(`
        SELECT name FROM regions
        WHERE country_code = $1
        ORDER BY name
      `, [countryCode]);

      console.log(`\nAvailable regions in ${countryCode}:`);
      console.log('-'.repeat(80));
      if (regions.rows.length > 0) {
        regions.rows.forEach(region => console.log(`  • ${region.name}`));
      } else {
        console.log('  (No regions found in database)');
      }
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkMissingRegions().catch(console.error);
