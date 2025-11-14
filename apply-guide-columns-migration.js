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
-- Add columns from CSV to guides table
ALTER TABLE guides
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS card_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TEXT,
ADD COLUMN IF NOT EXISTS province_issue TEXT,
ADD COLUMN IF NOT EXISTS card_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add index on card_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number);
`;

  console.log('Applying migration...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('Migration failed:', error);

      // Try alternative method using direct query
      console.log('\nTrying alternative method...\n');

      const statements = [
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS name TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS card_number TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS expiry_date TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS province_issue TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS card_type TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS language TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS experience TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS image_url TEXT",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS source_url TEXT",
        "CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number)"
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
      .select('*')
      .limit(1);

    if (!checkError && guides && guides.length > 0) {
      const columns = Object.keys(guides[0]);
      const newColumns = ['name', 'card_number', 'expiry_date', 'province_issue', 'card_type', 'language', 'experience', 'image_url', 'source_url'];

      console.log('\n✓ Columns in guides table:');
      newColumns.forEach(col => {
        const exists = columns.includes(col);
        console.log(`  ${exists ? '✓' : '✗'} ${col}`);
      });
    } else if (checkError) {
      console.log('Could not verify columns, but migration may have succeeded.');
      console.log('Please check the guides table in Supabase dashboard.');
    } else {
      console.log('Guides table is empty, cannot verify columns.');
      console.log('Columns should be added. You can verify in Supabase dashboard.');
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
