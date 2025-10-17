#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function checkAlternatives() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    const problematicCities = [
      { name: 'Trondheim', country: 'NO', expectedRegion: 'Trondelag' },
      { name: 'Okayama', country: 'JP', expectedRegion: 'Okayama' },
      { name: 'Novosibirsk', country: 'RU', expectedRegion: 'Novosibirsk Oblast' },
      { name: 'Port Said', country: 'EG', expectedRegion: 'Port Said' },
      { name: 'Suez', country: 'EG', expectedRegion: 'Suez' },
      { name: 'Nonthaburi', country: 'TH', expectedRegion: 'Nonthaburi' },
      { name: 'Pak Kret', country: 'TH', expectedRegion: 'Nonthaburi' },
    ];

    console.log('Checking for alternative region names...\n');
    console.log('='.repeat(80));

    for (const city of problematicCities) {
      console.log(`\n${city.name} (${city.country}) - Looking for: "${city.expectedRegion}"`);
      console.log('-'.repeat(80));

      // Try fuzzy matching
      const fuzzyQuery = `
        SELECT name,
               similarity(name, $1) as sim
        FROM regions
        WHERE country_code = $2
          AND similarity(name, $1) > 0.3
        ORDER BY sim DESC
        LIMIT 5
      `;

      const fuzzyResult = await client.query(fuzzyQuery, [city.expectedRegion, city.country]);

      if (fuzzyResult.rows.length > 0) {
        console.log('Possible matches:');
        fuzzyResult.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. "${row.name}" (similarity: ${(row.sim * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('No similar regions found.');
      }

      // Show all regions for this country
      const allRegions = await client.query(`
        SELECT name FROM regions WHERE country_code = $1 ORDER BY name
      `, [city.country]);

      console.log(`\nAll regions in ${city.country}:`);
      allRegions.rows.forEach(row => console.log(`  • ${row.name}`));
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAlternatives().catch(console.error);
