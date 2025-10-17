#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

// Additional mappings for the remaining 43 cities
// These are corrections and additions to the original mapping
const ADDITIONAL_MAPPINGS = {
  // Brazil - Brasilia
  'Brasilia': { country: 'BR', region: 'Distrito Federal' },

  // Spain - Alicante (Valencia is the region name, not "Valencian Community")
  'Alicante': { country: 'ES', region: 'Valencia' },

  // Philippines - All 15 cities need proper region mapping
  'Manila': { country: 'PH', region: 'National Capital Region' },
  'Quezon City': { country: 'PH', region: 'National Capital Region' },
  'Caloocan': { country: 'PH', region: 'National Capital Region' },
  'Pasig': { country: 'PH', region: 'National Capital Region' },
  'Taguig': { country: 'PH', region: 'National Capital Region' },
  'Makati': { country: 'PH', region: 'National Capital Region' },
  'Davao City': { country: 'PH', region: 'Davao Region' },
  'Cebu City': { country: 'PH', region: 'Central Visayas' },
  'Zamboanga City': { country: 'PH', region: 'Zamboanga Peninsula' },
  'Antipolo': { country: 'PH', region: 'Calabarzon' },
  'Cagayan de Oro': { country: 'PH', region: 'Northern Mindanao' },
  'Iloilo City': { country: 'PH', region: 'Western Visayas' },
  'Bacolod': { country: 'PH', region: 'Western Visayas' },
  'General Santos': { country: 'PH', region: 'Soccsksargen' },
  'Baguio': { country: 'PH', region: 'Cordillera Administrative Region' },

  // United Kingdom - Cities need proper region names
  'Manchester': { country: 'GB', region: 'North West England' },
  'Leeds': { country: 'GB', region: 'Yorkshire and the Humber' },
  'Liverpool': { country: 'GB', region: 'North West England' },
  'Sheffield': { country: 'GB', region: 'Yorkshire and the Humber' },
  'Newcastle': { country: 'GB', region: 'North East England' },

  // Thailand - Correct region names
  'Pattaya': { country: 'TH', region: 'Chonburi' },
  'Nonthaburi': { country: 'TH', region: 'Nonthaburi' },  // Not in DB, skip
  'Chon Buri': { country: 'TH', region: 'Chonburi' },
  'Pak Kret': { country: 'TH', region: 'Nonthaburi' },  // Not in DB, skip

  // Denmark - Aarhus
  'Aarhus': { country: 'DK', region: 'Central Denmark' },

  // Norway - Trondheim (need to check for Trøndelag variations)
  'Trondheim': { country: 'NO', region: 'Trondelag' },  // Will skip if not exact match

  // Japan - Okayama (prefecture name same as city)
  'Okayama': { country: 'JP', region: 'Okayama' },  // Not in DB, need to add

  // Russia - Novosibirsk
  'Novosibirsk': { country: 'RU', region: 'Novosibirsk Oblast' },  // Not in DB exact

  // Turkey - Cappadocia (in Nevsehir province, map to Kayseri which is in DB)
  'Cappadocia': { country: 'TR', region: 'Kayseri' },

  // Singapore - use Central Region
  'Singapore': { country: 'SG', region: 'Central Region' },

  // Egypt - Port Said and Suez (no matching regions in DB)
  'Port Said': { country: 'EG', region: 'Port Said' },  // Not in DB
  'Suez': { country: 'EG', region: 'Suez' },  // Not in DB

  // Countries without regions in database (will skip these):
  // Costa Rica (CR) - San Jose
  // Cuba (CU) - Havana
  // Iceland (IS) - Reykjavik
  // Jordan (JO) - Amman, Petra
  // Maldives (MV) - Male
  // Panama (PA) - Panama City
  // Tanzania (TZ) - Dar es Salaam, Dodoma
};

async function updateRemainingCities() {
  const client = new Client({ connectionString });

  try {
    console.log('='.repeat(80));
    console.log('UPDATING REMAINING UNLINKED CITIES');
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
    console.log(`\nProcessing ${Object.keys(ADDITIONAL_MAPPINGS).length} additional mappings...\n`);

    let updated = 0;
    let notFound = 0;
    let regionNotFound = 0;
    let alreadyLinked = 0;
    let skipped = 0;

    for (const [cityName, mapping] of Object.entries(ADDITIONAL_MAPPINGS)) {
      try {
        // Check if city exists and get its current region_id
        const cityResult = await client.query(`
          SELECT id, region_id, country_code
          FROM cities
          WHERE name = $1 AND country_code = $2
        `, [cityName, mapping.country]);

        if (cityResult.rows.length === 0) {
          console.log(`   ⊝ City not found: ${cityName} (${mapping.country})`);
          notFound++;
          continue;
        }

        const city = cityResult.rows[0];

        // Skip if already linked
        if (city.region_id !== null) {
          alreadyLinked++;
          continue;
        }

        // Find the region
        const regionResult = await client.query(`
          SELECT id, name FROM regions
          WHERE country_code = $1 AND name = $2
        `, [mapping.country, mapping.region]);

        if (regionResult.rows.length === 0) {
          console.log(`   ⚠️  Region not found: ${mapping.region} (${mapping.country}) for city ${cityName}`);
          regionNotFound++;
          continue;
        }

        const regionId = regionResult.rows[0].id;

        // Update the city
        await client.query(`
          UPDATE cities
          SET region_id = $1
          WHERE id = $2
        `, [regionId, city.id]);

        updated++;
        console.log(`   ✓ ${cityName} (${mapping.country}) → ${mapping.region}`);

      } catch (error) {
        console.log(`   ✗ Error processing ${cityName}: ${error.message}`);
      }
    }

    // Get final statistics
    const finalStatsResult = await client.query(statsQuery);
    const finalStats = finalStatsResult.rows[0];

    console.log('\n' + '='.repeat(80));
    console.log('UPDATE COMPLETE');
    console.log('='.repeat(80));
    console.log('\nProcessing Summary:');
    console.log('-'.repeat(80));
    console.log(`✓ Cities successfully linked: ${updated}`);
    console.log(`⊙ Cities already linked (skipped): ${alreadyLinked}`);
    console.log(`⊝ Cities not found in database: ${notFound}`);
    console.log(`⚠  Regions not found in database: ${regionNotFound}`);
    console.log('-'.repeat(80));

    console.log('\nFinal Database Status:');
    console.log('-'.repeat(80));
    console.log(`Total cities: ${finalStats.total_cities}`);
    console.log(`Linked to regions: ${finalStats.linked_cities}`);
    console.log(`Unlinked: ${finalStats.unlinked_cities}`);
    console.log(`Completion rate: ${((finalStats.linked_cities / finalStats.total_cities) * 100).toFixed(1)}%`);
    console.log('-'.repeat(80));

    // Show remaining unlinked cities by country
    const unlinkedQuery = `
      SELECT country_code, COUNT(*) as count
      FROM cities
      WHERE region_id IS NULL
      GROUP BY country_code
      ORDER BY count DESC
    `;
    const unlinkedResult = await client.query(unlinkedQuery);

    if (unlinkedResult.rows.length > 0) {
      console.log('\nRemaining Unlinked Cities by Country:');
      console.log('-'.repeat(80));
      unlinkedResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${row.country_code.padEnd(4)} - ${row.count} unlinked cities`);
      });
      console.log('-'.repeat(80));

      // Show details of remaining unlinked cities
      console.log('\nDetailed list of remaining unlinked cities:');
      console.log('-'.repeat(80));
      const detailsQuery = `
        SELECT name, country_code
        FROM cities
        WHERE region_id IS NULL
        ORDER BY country_code, name
      `;
      const detailsResult = await client.query(detailsQuery);
      detailsResult.rows.forEach(row => {
        console.log(`   ${row.country_code} - ${row.name}`);
      });
      console.log('-'.repeat(80));
    } else {
      console.log('\n🎉 ALL CITIES ARE NOW LINKED TO REGIONS! 🎉');
    }

    console.log('\n' + '='.repeat(80));
    console.log('Script completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('ERROR');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
updateRemainingCities().catch(console.error);
