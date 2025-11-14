// Import English names for agencies from CSV
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function importEnglishNames() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Import Agency English Names from CSV            ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Read CSV file
    const csvContent = fs.readFileSync('quanlyluhanh_companies_clean - quanlyluhanh_companies_clean.csv', 'utf-8');

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📄 Loaded ${records.length} agencies from CSV\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const record of records) {
      const vietnameseName = record['name'];
      const englishName = record['name (english)'];
      const licenseNo = record['license no'];

      if (!vietnameseName || !englishName) {
        continue;
      }

      // Find agency by Vietnamese name or license number
      const { data: agencies, error: findError } = await supabase
        .from('agencies')
        .select('id, name, contact_email')
        .or(`name.eq.${vietnameseName},registration_number.eq.${licenseNo}`)
        .limit(1);

      if (findError) {
        console.log(`❌ Error finding agency: ${vietnameseName}`);
        errors++;
        continue;
      }

      if (!agencies || agencies.length === 0) {
        notFound++;
        continue;
      }

      // Update with English name
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ name_english: englishName })
        .eq('id', agencies[0].id);

      if (updateError) {
        console.log(`❌ Error updating ${vietnameseName}: ${updateError.message}`);
        errors++;
      } else {
        updated++;
        if (updated % 10 === 0) {
          console.log(`✅ Updated ${updated} agencies...`);
        }
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║              IMPORT SUMMARY                       ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`⚠️  Not found in database: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  }
}

importEnglishNames()
  .then(() => {
    console.log('✅ Import completed!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
