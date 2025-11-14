// Generate SQL INSERT statements for natural reserves and parks
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📖 Reading parks data from JSON...\n');

  const parksData = JSON.parse(fs.readFileSync('parks-data.json', 'utf8'));
  console.log(`✅ Loaded ${parksData.length.toLocaleString()} parks\n`);

  // Get list of countries in database
  console.log('🔍 Fetching countries from database...\n');
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('code, name');

  if (countriesError) {
    console.error('❌ Error fetching countries:', countriesError);
    return;
  }

  const validCountryCodes = new Set(countries.map(c => c.code));
  console.log(`✅ Found ${validCountryCodes.size} countries in database\n`);

  // Filter parks for valid countries
  const validParks = parksData.filter(park =>
    park.country_code && validCountryCodes.has(park.country_code)
  );

  console.log(`✅ Filtered to ${validParks.length.toLocaleString()} parks in database countries\n`);

  // Count by country
  const countryStats = {};
  validParks.forEach(park => {
    const cc = park.country_code;
    if (!countryStats[cc]) {
      countryStats[cc] = { count: 0, name: countries.find(c => c.code === cc)?.name || cc };
    }
    countryStats[cc].count++;
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Parks by country (top 20):\n');
  Object.entries(countryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .forEach(([code, { count, name }]) => {
      console.log(`   ${code} (${name}): ${count.toLocaleString()}`);
    });

  // Generate SQL
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔧 Generating SQL INSERT statements...\n');

  let sqlContent = `-- ============================================================
-- POPULATE GLOBAL NATURAL RESERVES AND PARKS
-- ============================================================
-- This script adds ${validParks.length.toLocaleString()} natural reserves and parks from the global dataset
-- Source: natural reserves and parks.xlsx
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
-- ============================================================

-- Disable triggers temporarily for faster bulk insert
ALTER TABLE public.national_parks DISABLE TRIGGER ALL;

`;

  // Generate INSERT statements in batches of 1000
  const batchSize = 1000;
  let totalInserted = 0;

  for (let i = 0; i < validParks.length; i += batchSize) {
    const batch = validParks.slice(i, i + batchSize);

    sqlContent += `\n-- Batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, validParks.length)})\n`;
    sqlContent += `INSERT INTO public.national_parks (id, name, type, country_code, region_id)\nVALUES\n`;

    const values = batch.map(park => {
      // Escape single quotes in strings
      const name = (park.name || '').replace(/'/g, "''").substring(0, 254);
      const type = (park.type || 'Protected Area').replace(/'/g, "''").substring(0, 99);
      const countryCode = park.country_code;

      return `  (gen_random_uuid(), '${name}', '${type}', '${countryCode}', NULL)`;
    });

    sqlContent += values.join(',\n');
    sqlContent += `\nON CONFLICT (name, country_code) DO NOTHING;\n`;

    totalInserted += batch.length;

    if ((i + batchSize) % 10000 === 0) {
      console.log(`   Generated ${totalInserted.toLocaleString()} / ${validParks.length.toLocaleString()} records...`);
    }
  }

  sqlContent += `\n-- Re-enable triggers
ALTER TABLE public.national_parks ENABLE TRIGGER ALL;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '✅ Global parks and reserves populated!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added ${validParks.length.toLocaleString()} parks and reserves';
  RAISE NOTICE 'Covering ${Object.keys(countryStats).length} countries';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: region_id is NULL for most entries';
  RAISE NOTICE 'You can manually map major parks to regions later';
END $$;
`;

  // Write SQL file
  const outputFile = 'POPULATE_GLOBAL_PARKS.sql';
  fs.writeFileSync(outputFile, sqlContent);

  console.log(`\n✅ SQL file generated: ${outputFile}`);
  console.log(`   File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total INSERT statements: ${Math.ceil(validParks.length / batchSize)}`);
  console.log(`   Total parks: ${validParks.length.toLocaleString()}`);
  console.log(`   Countries covered: ${Object.keys(countryStats).length}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  IMPORTANT NOTES:\n');
  console.log('1. This is a LARGE SQL file - it may take several minutes to run');
  console.log('2. Run it in Supabase SQL Editor during off-peak hours');
  console.log('3. Most parks have region_id = NULL (no region mapping)');
  console.log('4. You can add region mapping later for major/popular parks');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
