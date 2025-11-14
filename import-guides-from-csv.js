const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse CSV line (handles commas in quoted fields)
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

// Parse languages from comma-separated string
function parseLanguages(langString) {
  if (!langString || langString.trim() === '') return [];

  return langString
    .split(',')
    .map(lang => lang.trim().toLowerCase())
    .filter(lang => lang.length > 0);
}

async function importGuides() {
  const csvPath = 'C:\\Users\\PC\\Guide-Validator\\hdv_output_1311_fixed.csv';

  console.log('Reading CSV file...');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

  // Skip header
  const header = parseCSVLine(lines[0]);
  console.log('CSV Headers:', header);

  const dataLines = lines.slice(1);
  console.log(`Total guides to import: ${dataLines.length}`);

  // Process in batches of 100
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const guides = [];

    for (const line of batch) {
      const values = parseCSVLine(line);

      // Map CSV columns to guide_imports table columns
      const guide = {
        full_name: values[0] || '',
        license_number: values[1] || '',
        license_expiry_date: values[2] || null,
        license_authority: values[3] || null,
        license_card_type: values[4] || null,
        spoken_languages: parseLanguages(values[5]),
        experience_text: values[6] || null,
        image_url: values[7] || null,
        source_url: values[8] || null,
        import_source: 'hdv_output_1311_fixed.csv',
        claimed: false
      };

      // Skip if no name or license number
      if (!guide.full_name || !guide.license_number) {
        console.log(`⚠️  Skipping guide with missing data: ${guide.full_name || 'NO NAME'}`);
        continue;
      }

      guides.push(guide);
    }

    if (guides.length === 0) continue;

    // Insert batch
    const { data, error } = await supabase
      .from('guide_imports')
      .upsert(guides, {
        onConflict: 'license_number',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      errorCount += guides.length;
      errors.push({
        batch: i / batchSize + 1,
        error: error.message,
        count: guides.length
      });
    } else {
      successCount += guides.length;
      console.log(`✅ Batch ${i / batchSize + 1}/${Math.ceil(dataLines.length / batchSize)} - Imported ${guides.length} guides (Total: ${successCount})`);
    }
  }

  console.log('\n========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nError details:');
    errors.forEach(err => {
      console.log(`  Batch ${err.batch}: ${err.error} (${err.count} guides)`);
    });
  }

  // Check total in database
  const { count } = await supabase
    .from('guide_imports')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total guides in guide_imports table: ${count}`);
}

// Run import
importGuides().catch(console.error);
