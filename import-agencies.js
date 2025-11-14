const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV to Database column mapping
const COLUMN_MAPPING = {
  'stt': null, // Skip - just sequential number
  'name': 'name',
  'name (english)': 'english_name', // Store in application_data
  'type': 'type',
  'address': 'address', // Store in location_data
  'license no': 'registration_number',
  'issue date': 'license_issue_date', // Store in application_data
  'phone': 'contact_phone',
  'fax': 'fax', // Store in application_data
  'website': 'website_url',
  'email': 'contact_email'
};

// Type mapping from CSV to database enum
// Database enum values: 'agency', 'dmc', 'transport'
const TYPE_MAPPING = {
  'International Travel': 'agency',
  'Domestic travel': 'agency',
  'DMC': 'dmc',
  'Transport': 'transport'
};

// Default type for any unrecognized values
const DEFAULT_TYPE = 'agency';

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

function parseDateDDMMYYYY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  // DD/MM/YYYY -> YYYY-MM-DD
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function cleanPhoneNumber(phone) {
  if (!phone) return null;
  // Remove extra spaces and format
  return phone.trim().replace(/\s+/g, ' ');
}

function cleanWebsite(website) {
  if (!website || website.trim() === '') return null;
  website = website.trim();
  // Don't convert to lowercase - preserve original case
  if (!website.startsWith('http://') && !website.startsWith('https://')) {
    website = 'https://' + website;
  }
  return website;
}

async function importAgencies() {
  console.log('🚀 Starting agency import...\n');

  // Read CSV file with UTF-8 encoding
  const csvContent = fs.readFileSync(
    'C:\\Users\\PC\\Guide-Validator\\quanlyluhanh_companies_clean - quanlyluhanh_companies_clean.csv',
    'utf-8'
  );

  const lines = csvContent.split('\n');
  const headers = parseCSVLine(lines[0]);

  console.log('📋 CSV Headers:', headers);
  console.log(`📊 Total rows: ${lines.length - 1}\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches
  const BATCH_SIZE = 100;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue; // Skip malformed rows

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    try {
      // 1. Create profile for agency
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: row['name'],
          country_code: 'VN',
          role: 'agency', // Agency profile role
          application_status: 'pending', // Pending review
          verified: false, // Not claimed yet
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Profile error for ${row['name']}:`, profileError.message);
        errorCount++;
        errors.push({ row: i, name: row['name'], error: profileError.message });
        continue;
      }

      // 2. Determine agency type
      const csvType = row['type'];
      const agencyType = TYPE_MAPPING[csvType] || DEFAULT_TYPE;

      // 3. Create agency record
      const { error: agencyError } = await supabase
        .from('agencies')
        .insert({
          // Core fields
          name: row['name'],
          type: agencyType,
          registration_number: row['license no'],
          contact_email: row['email'] || null,
          contact_phone: cleanPhoneNumber(row['phone']),
          website_url: cleanWebsite(row['website']),
          country_code: 'VN',

          // Application fields
          application_status: 'pending', // Pending review
          verified: false,
          featured: false,

          // Arrays
          languages: ['vi'], // Vietnamese
          specialties: [],
          services_offered: [],

          // JSONB data fields
          application_data: {
            english_name: row['name (english)'],
            license_issue_date: parseDateDDMMYYYY(row['issue date']),
            fax: row['fax'] || null,
            import_source: 'quanlyluhanh_companies_clean',
            imported_at: new Date().toISOString()
          },

          location_data: {
            headquarters_address: row['address']
          },

          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (agencyError) {
        console.error(`❌ Agency error for ${row['name']}:`, agencyError.message);
        errorCount++;
        errors.push({ row: i, name: row['name'], error: agencyError.message });
        continue;
      }

      successCount++;

      // Progress update
      if (successCount % BATCH_SIZE === 0) {
        console.log(`✅ Imported ${successCount} agencies...`);
      }

    } catch (err) {
      console.error(`❌ Unexpected error for ${row['name']}:`, err.message);
      errorCount++;
      errors.push({ row: i, name: row['name'], error: err.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n⚠️ First 10 errors:');
    errors.slice(0, 10).forEach(err => {
      console.log(`  Row ${err.row}: ${err.name} - ${err.error}`);
    });
  }

  // Save full error log
  if (errors.length > 0) {
    fs.writeFileSync(
      'C:\\Users\\PC\\Guide-Validator\\agency-import-errors.json',
      JSON.stringify(errors, null, 2)
    );
    console.log('\n📄 Full error log saved to: agency-import-errors.json');
  }

  console.log('\n🎉 Import complete!');
}

// Run import
importAgencies().catch(console.error);
