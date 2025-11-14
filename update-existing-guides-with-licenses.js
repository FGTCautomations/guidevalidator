const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Normalize name for matching
function normalizeName(name) {
  return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

async function updateGuidesWithLicenses() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  UPDATE EXISTING GUIDES WITH LICENSE NUMBERS  ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const csvPath = 'C:\\Users\\PC\\OneDrive - DLDV Enterprises\\Desktop\\guidevalditaor back up\\VIETNAM_LIST.csv';

  // Step 1: Read CSV and build lookup map
  console.log('Step 1: Reading CSV file...');
  const licenseLookup = new Map();

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'utf-8' })
      .pipe(csv({ skipLines: 0 }))
      .on('data', (row) => {
        // Clean BOM from first key if present
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          cleanRow[cleanKey] = value;
        }

        // Skip rows with malformed names
        if (cleanRow.name && cleanRow.card_number && !cleanRow.name.includes('Số thẻ:')) {
          const normalizedName = normalizeName(cleanRow.name);

          // Parse languages
          let languages = [];
          if (cleanRow.language) {
            try {
              languages = cleanRow.language
                .replace(/"""/g, '')
                .replace(/"/g, '')
                .split(',')
                .map(lang => lang.trim())
                .filter(lang => lang);
            } catch (e) {
              languages = [];
            }
          }

          // Parse experience years
          let yearsExperience = null;
          if (cleanRow.experience) {
            const match = cleanRow.experience.match(/(\d+)/);
            if (match) {
              yearsExperience = parseInt(match[1]);
            }
          }

          licenseLookup.set(normalizedName, {
            name: cleanRow.name,
            license_number: cleanRow.card_number.trim(),
            license_authority: cleanRow.province_issue,
            license_expiry_date: cleanRow.expiry_date,
            license_card_type: cleanRow.card_type,
            spoken_languages: languages,
            years_experience: yearsExperience,
            experience_text: cleanRow.experience,
            image_url: cleanRow.image_url,
            source_url: cleanRow.source_url,
          });
        }
      })
      .on('end', () => {
        console.log(`✓ Read ${licenseLookup.size} license records from CSV\n`);
        resolve();
      })
      .on('error', reject);
  });

  // Step 2: Get all existing guides
  console.log('Step 2: Fetching existing guides...');
  const { data: guides, error: fetchError } = await supabase
    .from('guides')
    .select(`
      profile_id,
      license_number,
      profiles!inner(
        id,
        full_name
      )
    `);

  if (fetchError) {
    console.error('Error fetching guides:', fetchError);
    return;
  }

  console.log(`✓ Found ${guides.length} existing guides\n`);

  // Step 3: Match and update
  console.log('Step 3: Matching guides with license data...');
  let matched = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const guide of guides) {
    const profile = guide.profiles;
    const normalizedName = normalizeName(profile.full_name);
    const licenseData = licenseLookup.get(normalizedName);

    if (!licenseData) {
      skipped++;
      continue;
    }

    matched++;

    // Skip if already has license number
    if (guide.license_number) {
      console.log(`  ℹ Skipping ${profile.full_name} - already has license ${guide.license_number}`);
      continue;
    }

    try {
      // Update guide record
      const { error: guideError } = await supabase
        .from('guides')
        .update({
          license_number: licenseData.license_number,
          license_authority: licenseData.license_authority,
          spoken_languages: licenseData.spoken_languages.length > 0 ? licenseData.spoken_languages : guide.spoken_languages,
          years_experience: licenseData.years_experience || guide.years_experience,
          application_data: {
            ...(guide.application_data || {}),
            license_expiry_date: licenseData.license_expiry_date,
            license_card_type: licenseData.license_card_type,
            license_updated_from_csv: true,
            license_update_date: new Date().toISOString(),
            original_data: {
              experience_text: licenseData.experience_text,
              image_url: licenseData.image_url,
              source_url: licenseData.source_url,
            }
          },
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', guide.profile_id);

      if (guideError) {
        console.error(`  ✗ Error updating ${profile.full_name}:`, guideError.message);
        errors++;
        continue;
      }

      updated++;
      if (updated % 50 === 0) {
        console.log(`  ✓ Updated ${updated} guides...`);
      }

    } catch (error) {
      console.error(`  ✗ Error processing ${profile.full_name}:`, error.message);
      errors++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              UPDATE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total guides in database:     ${guides.length}`);
  console.log(`CSV records available:        ${licenseLookup.size}`);
  console.log(`Matched by name:              ${matched}`);
  console.log(`Successfully updated:         ${updated}`);
  console.log(`Already had license:          ${matched - updated - errors}`);
  console.log(`No match found:               ${skipped}`);
  console.log(`Errors:                       ${errors}`);
  console.log('════════════════════════════════════════════════\n');
}

updateGuidesWithLicenses()
  .then(() => {
    console.log('✓ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
