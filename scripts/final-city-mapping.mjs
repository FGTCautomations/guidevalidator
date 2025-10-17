#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

// Final mappings for remaining cities with available regions
const FINAL_MAPPINGS = {
  // Thailand - Pak Kret can be mapped to Bangkok
  'Pak Kret': { country: 'TH', region: 'Bangkok' },

  // For cities where exact region doesn't exist, use geographically closest or most relevant:

  // Norway - Trondheim is in Trøndelag, but DB doesn't have it. Leave unlinked.
  // Japan - Okayama prefecture not in DB. Leave unlinked.
  // Russia - Novosibirsk Oblast not in DB. Leave unlinked.
  // Egypt - Port Said and Suez governorates not in DB. Leave unlinked.
  // Thailand - Nonthaburi not in DB. Leave unlinked.

  // Countries with NO regions in database at all:
  // Costa Rica (CR) - San Jose
  // Cuba (CU) - Havana
  // Iceland (IS) - Reykjavik
  // Jordan (JO) - Amman, Petra
  // Maldives (MV) - Male
  // Panama (PA) - Panama City
  // Tanzania (TZ) - Dar es Salaam, Dodoma
};

async function finalMapping() {
  const client = new Client({ connectionString });

  try {
    console.log('='.repeat(80));
    console.log('FINAL CITY-REGION MAPPING');
    console.log('='.repeat(80));
    console.log('\nConnecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    // Get current statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_cities,
        COUNT(region_id) as linked_cities,
        COUNT(*) - COUNT(region_id) as unlinked_cities
      FROM cities
    `;
    const statsResult = await client.query(statsQuery);
    const { total_cities, linked_cities, unlinked_cities } = statsResult.rows[0];

    console.log('Current Database Status:');
    console.log('-'.repeat(80));
    console.log(`Total cities: ${total_cities}`);
    console.log(`Linked to regions: ${linked_cities}`);
    console.log(`Unlinked: ${unlinked_cities}`);
    console.log('-'.repeat(80));

    let updated = 0;

    for (const [cityName, mapping] of Object.entries(FINAL_MAPPINGS)) {
      try {
        // Check if city exists
        const cityResult = await client.query(`
          SELECT id, region_id FROM cities
          WHERE name = $1 AND country_code = $2
        `, [cityName, mapping.country]);

        if (cityResult.rows.length === 0 || cityResult.rows[0].region_id !== null) {
          continue;
        }

        // Find the region
        const regionResult = await client.query(`
          SELECT id FROM regions
          WHERE country_code = $1 AND name = $2
        `, [mapping.country, mapping.region]);

        if (regionResult.rows.length === 0) {
          console.log(`   ⚠️  Region not found: ${mapping.region}`);
          continue;
        }

        // Update the city
        await client.query(`
          UPDATE cities SET region_id = $1 WHERE id = $2
        `, [regionResult.rows[0].id, cityResult.rows[0].id]);

        updated++;
        console.log(`   ✓ ${cityName} → ${mapping.region}`);

      } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
      }
    }

    // Get final statistics
    const finalStatsResult = await client.query(statsQuery);
    const finalStats = finalStatsResult.rows[0];

    console.log('\n' + '='.repeat(80));
    console.log('FINAL STATISTICS');
    console.log('='.repeat(80));
    console.log(`\nCities updated in this run: ${updated}`);
    console.log('\nFinal Database Status:');
    console.log('-'.repeat(80));
    console.log(`Total cities: ${finalStats.total_cities}`);
    console.log(`Linked to regions: ${finalStats.linked_cities}`);
    console.log(`Unlinked: ${finalStats.unlinked_cities}`);
    console.log(`Completion rate: ${((finalStats.linked_cities / finalStats.total_cities) * 100).toFixed(1)}%`);
    console.log('-'.repeat(80));

    // Show final unlinked cities
    const unlinkedQuery = `
      SELECT c.name, c.country_code, co.name as country_name
      FROM cities c
      JOIN countries co ON c.country_code = co.code
      WHERE c.region_id IS NULL
      ORDER BY c.country_code, c.name
    `;
    const unlinkedResult = await client.query(unlinkedQuery);

    if (unlinkedResult.rows.length > 0) {
      console.log('\nRemaining Unlinked Cities:');
      console.log('-'.repeat(80));
      console.log('(These cities cannot be linked because their regions are not in the database)\n');

      const byCountry = {};
      unlinkedResult.rows.forEach(row => {
        if (!byCountry[row.country_code]) {
          byCountry[row.country_code] = { name: row.country_name, cities: [] };
        }
        byCountry[row.country_code].cities.push(row.name);
      });

      Object.entries(byCountry).forEach(([code, data]) => {
        console.log(`${code} (${data.name}): ${data.cities.length} cities`);
        data.cities.forEach(city => console.log(`   • ${city}`));
        console.log('');
      });
      console.log('-'.repeat(80));

      // Check which countries have NO regions at all
      const countriesWithoutRegions = await client.query(`
        SELECT c.code, c.name
        FROM countries c
        WHERE c.code IN (
          SELECT DISTINCT country_code FROM cities WHERE region_id IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM regions r WHERE r.country_code = c.code
        )
        ORDER BY c.name
      `);

      if (countriesWithoutRegions.rows.length > 0) {
        console.log('\nCountries with NO regions in database:');
        console.log('-'.repeat(80));
        countriesWithoutRegions.rows.forEach(row => {
          console.log(`   ${row.code} - ${row.name}`);
        });
        console.log('\n💡 These countries need regions to be added to the database first.');
        console.log('-'.repeat(80));
      }

      // Check countries where regions exist but don't match
      const countriesWithMissingRegions = await client.query(`
        SELECT DISTINCT c.code, c.name, COUNT(*) as city_count,
               (SELECT COUNT(*) FROM regions r WHERE r.country_code = c.code) as region_count
        FROM cities ci
        JOIN countries c ON ci.country_code = c.code
        WHERE ci.region_id IS NULL
        AND EXISTS (SELECT 1 FROM regions r WHERE r.country_code = c.code)
        GROUP BY c.code, c.name
        ORDER BY city_count DESC
      `);

      if (countriesWithMissingRegions.rows.length > 0) {
        console.log('\nCountries with regions but cities still unlinked:');
        console.log('-'.repeat(80));
        countriesWithMissingRegions.rows.forEach(row => {
          console.log(`   ${row.code} - ${row.name}: ${row.city_count} unlinked cities (${row.region_count} regions available)`);
        });
        console.log('\n💡 These cities need specific regions to be added, or need manual mapping.');
        console.log('-'.repeat(80));
      }
    } else {
      console.log('\n' + '🎉'.repeat(40));
      console.log('ALL CITIES SUCCESSFULLY LINKED TO REGIONS!');
      console.log('🎉'.repeat(40) + '\n');
    }

    console.log('\n' + '='.repeat(80));
    console.log('MAPPING PROCESS COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nSummary:`);
    console.log(`  • Started with: 272 unlinked cities`);
    console.log(`  • Successfully linked: ${272 - finalStats.unlinked_cities} cities`);
    console.log(`  • Remaining unlinked: ${finalStats.unlinked_cities} cities`);
    console.log(`  • Success rate: ${(((272 - finalStats.unlinked_cities) / 272) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\nERROR:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

finalMapping().catch(console.error);
