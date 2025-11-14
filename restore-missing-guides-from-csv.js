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

async function fetchAllGuidesLicenses() {
  console.log('Fetching all license numbers from guides table...');
  let allLicenses = new Set();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('guides')
      .select('license_number')
      .not('license_number', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching guides:', error);
      break;
    }

    if (!data || data.length === 0) break;

    data.forEach(guide => {
      if (guide.license_number) {
        allLicenses.add(guide.license_number.trim());
      }
    });

    console.log(`  Found ${allLicenses.size} unique licenses so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allLicenses;
}

async function readCSV() {
  const csvPath = 'C:\\Users\\PC\\OneDrive - DLDV Enterprises\\Desktop\\guidevalditaor back up\\VIETNAM_LIST.csv';
  const guides = [];

  return new Promise((resolve, reject) => {
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
          guides.push({
            name: cleanRow.name.trim(),
            card_number: cleanRow.card_number.trim(),
            expiry_date: cleanRow.expiry_date,
            province_issue: cleanRow.province_issue,
            card_type: cleanRow.card_type,
            language: cleanRow.language,
            experience: cleanRow.experience,
            image_url: cleanRow.image_url,
            source_url: cleanRow.source_url,
          });
        }
      })
      .on('end', () => {
        resolve(guides);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function restoreMissingGuides() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  RESTORE MISSING GUIDES FROM CSV               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get all existing guide licenses from database
  console.log('Step 1: Fetching existing licenses from database...');
  const existingLicenses = await fetchAllGuidesLicenses();
  console.log(`✓ Found ${existingLicenses.size} unique licenses in database\n`);

  // Step 2: Read CSV file
  console.log('Step 2: Reading CSV file...');
  const csvGuides = await readCSV();
  console.log(`✓ Found ${csvGuides.length} guides in CSV\n`);

  // Step 3: Find missing licenses
  console.log('Step 3: Finding licenses in CSV that are missing from database...');
  const missingGuides = csvGuides.filter(guide =>
    !existingLicenses.has(guide.card_number.trim())
  );
  console.log(`✓ Found ${missingGuides.length} guides missing from database\n`);

  if (missingGuides.length === 0) {
    console.log('No missing guides to restore!');
    return { added: 0, errors: 0 };
  }

  // Show sample of missing guides
  console.log('Sample of missing guides:');
  for (let i = 0; i < Math.min(5, missingGuides.length); i++) {
    console.log(`  - ${missingGuides[i].name} (License: ${missingGuides[i].card_number})`);
  }
  console.log('');

  // Step 4: Create profile_claim_tokens for missing guides
  console.log('Step 4: Creating claim tokens for missing guides...');
  console.log('(These guides can claim their profiles later using the token system)\n');

  let added = 0;
  let errors = 0;
  const crypto = require('crypto');

  for (const guide of missingGuides) {
    try {
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('base64');

      // Calculate expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      // Insert into profile_claim_tokens
      const { error: insertError } = await supabase
        .from('profile_claim_tokens')
        .insert({
          license_number: guide.card_number,
          token: token,
          expires_at: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        // Check if it's a duplicate key error (already exists)
        if (insertError.code === '23505') {
          console.log(`  ℹ Skipping ${guide.name} - claim token already exists`);
          continue;
        }
        console.error(`  ✗ Error creating claim token for ${guide.name}:`, insertError.message);
        errors++;
        continue;
      }

      added++;
      console.log(`  ✓ Created claim token for ${guide.name} (License: ${guide.card_number})`);

      if (added % 100 === 0) {
        console.log(`    Progress: ${added} claim tokens created...`);
      }

    } catch (error) {
      console.error(`  ✗ Error processing ${guide.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              RESTORE SUMMARY                   ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total in CSV:                 ${csvGuides.length}`);
  console.log(`Already in database:          ${existingLicenses.size}`);
  console.log(`Missing from database:        ${missingGuides.length}`);
  console.log(`Claim tokens created:         ${added}`);
  console.log(`Errors:                       ${errors}`);
  console.log('════════════════════════════════════════════════\n');

  return { added, errors };
}

restoreMissingGuides()
  .then((result) => {
    console.log('✓ Process completed!');
    console.log('\nNote: Guides can now claim their profiles using their license numbers');
    console.log('through the profile claim system. No auth accounts were created to');
    console.log('avoid rate limiting issues.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
