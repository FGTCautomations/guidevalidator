#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

// Mapping of city names to their regions
const CITY_REGION_MAPPING = {
  // Australia
  'Sydney': { country: 'AU', region: 'New South Wales' },
  'Melbourne': { country: 'AU', region: 'Victoria' },
  'Brisbane': { country: 'AU', region: 'Queensland' },
  'Perth': { country: 'AU', region: 'Western Australia' },
  'Adelaide': { country: 'AU', region: 'South Australia' },
  'Gold Coast': { country: 'AU', region: 'Queensland' },
  'Canberra': { country: 'AU', region: 'Australian Capital Territory' },
  'Newcastle': { country: 'AU', region: 'New South Wales' },
  'Wollongong': { country: 'AU', region: 'New South Wales' },
  'Hobart': { country: 'AU', region: 'Tasmania' },

  // United States - Major cities
  'New York': { country: 'US', region: 'New York' },
  'Los Angeles': { country: 'US', region: 'California' },
  'Chicago': { country: 'US', region: 'Illinois' },
  'Houston': { country: 'US', region: 'Texas' },
  'Phoenix': { country: 'US', region: 'Arizona' },
  'Philadelphia': { country: 'US', region: 'Pennsylvania' },
  'San Antonio': { country: 'US', region: 'Texas' },
  'San Diego': { country: 'US', region: 'California' },
  'Dallas': { country: 'US', region: 'Texas' },
  'San Jose': { country: 'US', region: 'California' },
  'Austin': { country: 'US', region: 'Texas' },
  'Jacksonville': { country: 'US', region: 'Florida' },
  'Fort Worth': { country: 'US', region: 'Texas' },
  'Columbus': { country: 'US', region: 'Ohio' },
  'Indianapolis': { country: 'US', region: 'Indiana' },
  'Charlotte': { country: 'US', region: 'North Carolina' },
  'San Francisco': { country: 'US', region: 'California' },
  'Seattle': { country: 'US', region: 'Washington' },
  'Denver': { country: 'US', region: 'Colorado' },
  'Washington': { country: 'US', region: 'District of Columbia' },
  'Boston': { country: 'US', region: 'Massachusetts' },
  'Nashville': { country: 'US', region: 'Tennessee' },
  'Las Vegas': { country: 'US', region: 'Nevada' },
  'Portland': { country: 'US', region: 'Oregon' },
  'Miami': { country: 'US', region: 'Florida' },
  'Atlanta': { country: 'US', region: 'Georgia' },
  'Detroit': { country: 'US', region: 'Michigan' },
  'Minneapolis': { country: 'US', region: 'Minnesota' },
  'New Orleans': { country: 'US', region: 'Louisiana' },
  'Tampa': { country: 'US', region: 'Florida' },

  // Add more mappings as needed...
};

async function linkCitiesToRegions() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    console.log('🔗 Linking cities to regions...\n');
    await client.connect();

    let updated = 0;
    let notFound = 0;

    for (const [cityName, mapping] of Object.entries(CITY_REGION_MAPPING)) {
      try {
        // Find the region
        const regionResult = await client.query(`
          SELECT id FROM regions
          WHERE country_code = $1 AND name = $2
        `, [mapping.country, mapping.region]);

        if (regionResult.rows.length === 0) {
          console.log(`   ⚠️  Region not found: ${mapping.region} (${mapping.country})`);
          notFound++;
          continue;
        }

        const regionId = regionResult.rows[0].id;

        // Update the city
        const updateResult = await client.query(`
          UPDATE cities
          SET region_id = $1
          WHERE name = $2 AND country_code = $3
        `, [regionId, cityName, mapping.country]);

        if (updateResult.rowCount > 0) {
          updated++;
          console.log(`   ✓ ${cityName} → ${mapping.region}`);
        }

      } catch (error) {
        console.log(`   ✗ Error updating ${cityName}: ${error.message}`);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   📊 Updated: ${updated}`);
    console.log(`   📊 Not found: ${notFound}`);

    // Verify
    const verifyResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(region_id) as linked
      FROM cities
    `);

    console.log(`\n📊 Database status:`);
    console.log(`   Total cities: ${verifyResult.rows[0].total}`);
    console.log(`   Linked to regions: ${verifyResult.rows[0].linked}`);
    console.log(`   Unlinked: ${verifyResult.rows[0].total - verifyResult.rows[0].linked}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

linkCitiesToRegions();
