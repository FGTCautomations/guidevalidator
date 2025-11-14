const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanWebsite(website) {
  if (!website || website.trim() === '') return null;
  website = website.trim();
  if (!website.startsWith('http://') && !website.startsWith('https://')) {
    website = 'https://' + website;
  }
  return website;
}

async function updateAgencies() {
  console.log('🚀 Updating agency data...\n');

  // Read CSV
  const csvContent = fs.readFileSync(
    'C:\\Users\\PC\\Guide-Validator\\quanlyluhanh_companies_clean - quanlyluhanh_companies_clean.csv',
    'utf-8'
  );

  const lines = csvContent.split('\n');
  const headers = parseCSVLine(lines[0]);

  console.log('📋 CSV Headers:', headers);
  console.log(`📊 Processing ${lines.length - 1} rows\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const agencyName = row['name'];
    const englishName = row['name (english)'];
    const website = cleanWebsite(row['website']);

    try {
      // Find the agency by name
      const { data: existingAgency, error: fetchError } = await supabase
        .from('agencies')
        .select('id, application_data, website_url')
        .eq('name', agencyName)
        .single();

      if (fetchError || !existingAgency) {
        skippedCount++;
        continue;
      }

      // Prepare update
      const updates = {};
      let needsUpdate = false;

      // Update website if missing
      if (website && !existingAgency.website_url) {
        updates.website_url = website;
        needsUpdate = true;
      }

      // Update english name if missing
      if (englishName && englishName.trim() !== '') {
        const currentData = existingAgency.application_data || {};
        if (!currentData.english_name) {
          updates.application_data = {
            ...currentData,
            english_name: englishName
          };
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('agencies')
          .update(updates)
          .eq('id', existingAgency.id);

        if (updateError) {
          console.error(`❌ Error updating ${agencyName}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 100 === 0) {
            console.log(`✅ Updated ${successCount} agencies...`);
          }
        }
      }

    } catch (err) {
      console.error(`❌ Error processing ${agencyName}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`⏭️  Skipped (not found): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\n🎉 Update complete!');
}

updateAgencies().catch(console.error);
