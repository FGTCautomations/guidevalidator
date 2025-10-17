#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function findBestRegions() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    const problematicCities = [
      { name: 'Trondheim', country: 'NO', search: ['Trondelag', 'Trøndelag', 'Trondelag', 'Central Norway'] },
      { name: 'Okayama', country: 'JP', search: ['Okayama'] },
      { name: 'Novosibirsk', country: 'RU', search: ['Novosibirsk'] },
      { name: 'Port Said', country: 'EG', search: ['Port Said', 'Bur Said'] },
      { name: 'Suez', country: 'EG', search: ['Suez', 'As Suways'] },
      { name: 'Nonthaburi', country: 'TH', search: ['Nonthaburi', 'Nakhon Pathom'] },
      { name: 'Pak Kret', country: 'TH', search: ['Nonthaburi', 'Bangkok'] },
    ];

    console.log('Finding best region matches...\n');
    console.log('='.repeat(80));

    const solutions = [];

    for (const city of problematicCities) {
      console.log(`\n${city.name} (${city.country})`);
      console.log('-'.repeat(80));

      let foundMatch = null;

      // Try each search term
      for (const searchTerm of city.search) {
        const result = await client.query(`
          SELECT id, name FROM regions
          WHERE country_code = $1 AND LOWER(name) LIKE LOWER($2)
        `, [city.country, `%${searchTerm}%`]);

        if (result.rows.length > 0) {
          foundMatch = result.rows[0];
          console.log(`✓ Found match: "${foundMatch.name}" (searched for: "${searchTerm}")`);
          solutions.push({ city: city.name, country: city.country, region: foundMatch.name });
          break;
        } else {
          console.log(`  ⊝ No match for: "${searchTerm}"`);
        }
      }

      if (!foundMatch) {
        // Show all available regions
        const allRegions = await client.query(`
          SELECT name FROM regions WHERE country_code = $1 ORDER BY name
        `, [city.country]);

        console.log(`\n  Available regions in ${city.country}:`);
        allRegions.rows.forEach(row => console.log(`    • ${row.name}`));

        // Suggest using first available region or capital
        if (allRegions.rows.length > 0) {
          console.log(`\n  💡 Suggestion: Use "${allRegions.rows[0].name}" as fallback`);
          solutions.push({ city: city.name, country: city.country, region: allRegions.rows[0].name, isFallback: true });
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDED MAPPINGS');
    console.log('='.repeat(80));

    solutions.forEach(sol => {
      const fallback = sol.isFallback ? ' (FALLBACK)' : '';
      console.log(`'${sol.city}': { country: '${sol.country}', region: '${sol.region}' },${fallback}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

findBestRegions().catch(console.error);
