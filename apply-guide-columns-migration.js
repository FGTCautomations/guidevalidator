const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  APPLY MIGRATION: ADD COLUMNS TO GUIDES TABLE  ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const migrationSQL = `
-- Add missing columns for profile completion
ALTER TABLE guides
ADD COLUMN IF NOT EXISTS professional_intro TEXT,
ADD COLUMN IF NOT EXISTS contact_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
`;

  console.log('Applying migration to add missing profile completion columns...\n');

  try {
    const { data, error} = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('Migration failed:', error);

      // Try alternative method using direct query
      console.log('\nTrying alternative method...\n');

      const statements = [
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS professional_intro TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS contact_methods JSONB DEFAULT '[]'::jsonb",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS location_data JSONB",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS profile_photo_url TEXT"
      ];

      for (const stmt of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: stmt });
        if (stmtError) {
          console.error(`  ✗ Error: ${stmt}`, stmtError.message);
        } else {
          console.log(`  ✓ Success: ${stmt.substring(0, 60)}...`);
        }
      }
    } else {
      console.log('✓ Migration applied successfully!\n');
    }

    // Verify the columns were added
    console.log('\nVerifying columns...');
    const { data: guides, error: checkError } = await supabase
      .from('guides')
      .select('professional_intro, contact_methods, location_data, profile_photo_url')
      .limit(1);

    if (!checkError) {
      console.log('\n✓ All new columns added successfully:');
      console.log('  ✓ professional_intro');
      console.log('  ✓ contact_methods');
      console.log('  ✓ location_data');
      console.log('  ✓ profile_photo_url');
    } else if (checkError) {
      console.log('Could not verify columns, but migration may have succeeded.');
      console.log('Error:', checkError.message);
      console.log('Please check the guides table in Supabase dashboard.');
    }

  } catch (err) {
    console.error('Error applying migration:', err.message);
    console.log('\nPlease apply the migration manually in Supabase SQL Editor:');
    console.log('File: supabase/migrations/20250203_add_guide_csv_columns.sql\n');
  }

  console.log('\n✓ Process completed!\n');
}

applyMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Process failed:', error);
    process.exit(1);
  });
