// Check which regions are missing cities and parks
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking for regions missing cities and parks...\n');

  // Get all regions
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name, country_code, type')
    .order('country_code')
    .order('name');

  if (regionsError) {
    console.error('❌ Error fetching regions:', regionsError);
    return;
  }

  console.log(`📊 Total regions in database: ${regions.length}\n`);

  const regionsWithoutCities = [];
  const regionsWithoutParks = [];

  // Check each region for cities and parks
  for (const region of regions) {
    // Check cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('id')
      .eq('region_id', region.id)
      .limit(1);

    if (!citiesError && (!cities || cities.length === 0)) {
      regionsWithoutCities.push(region);
    }

    // Check parks
    const { data: parks, error: parksError } = await supabase
      .from('national_parks')
      .select('id')
      .eq('region_id', region.id)
      .limit(1);

    if (!parksError && (!parks || parks.length === 0)) {
      regionsWithoutParks.push(region);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 SUMMARY\n');
  console.log(`✅ Regions with cities: ${regions.length - regionsWithoutCities.length}`);
  console.log(`❌ Regions WITHOUT cities: ${regionsWithoutCities.length}`);
  console.log(`✅ Regions with parks: ${regions.length - regionsWithoutParks.length}`);
  console.log(`❌ Regions WITHOUT parks: ${regionsWithoutParks.length}`);

  // Group by country
  const countriesWithMissingData = {};

  regionsWithoutCities.forEach(region => {
    if (!countriesWithMissingData[region.country_code]) {
      countriesWithMissingData[region.country_code] = {
        noCities: [],
        noParks: []
      };
    }
    countriesWithMissingData[region.country_code].noCities.push(region);
  });

  regionsWithoutParks.forEach(region => {
    if (!countriesWithMissingData[region.country_code]) {
      countriesWithMissingData[region.country_code] = {
        noCities: [],
        noParks: []
      };
    }
    countriesWithMissingData[region.country_code].noParks.push(region);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 REGIONS MISSING DATA BY COUNTRY\n');

  Object.keys(countriesWithMissingData).sort().forEach(countryCode => {
    const data = countriesWithMissingData[countryCode];

    if (data.noCities.length > 0 || data.noParks.length > 0) {
      console.log(`\n🌍 ${countryCode}`);

      if (data.noCities.length > 0) {
        console.log(`\n   ❌ Regions without cities (${data.noCities.length}):`);
        data.noCities.forEach(region => {
          console.log(`      - ${region.name} (ID: ${region.id})`);
        });
      }

      if (data.noParks.length > 0) {
        console.log(`\n   ❌ Regions without parks (${data.noParks.length}):`);
        data.noParks.forEach(region => {
          console.log(`      - ${region.name} (ID: ${region.id})`);
        });
      }
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 NEXT STEPS:\n');
  console.log('1. Review the list of regions without data');
  console.log('2. Research major cities and tourist attractions for each region');
  console.log('3. Use the populate-locations.js script to add the data');
  console.log('4. Or manually add data via Supabase SQL Editor\n');

  // Show some examples for Netherlands
  console.log('📝 EXAMPLE: Netherlands regions that need data:\n');

  const { data: nlRegions, error: nlError } = await supabase
    .from('regions')
    .select('id, name')
    .eq('country_code', 'NL')
    .order('name');

  if (!nlError && nlRegions) {
    for (const region of nlRegions) {
      const { data: cities } = await supabase
        .from('cities')
        .select('name')
        .eq('region_id', region.id);

      const { data: parks } = await supabase
        .from('national_parks')
        .select('name')
        .eq('region_id', region.id);

      console.log(`\n   ${region.name}:`);
      console.log(`      Cities: ${cities?.length || 0} (${cities?.map(c => c.name).join(', ') || 'none'})`);
      console.log(`      Parks: ${parks?.length || 0} (${parks?.map(p => p.name).join(', ') || 'none'})`);
    }
  }
}

main().catch(console.error);
