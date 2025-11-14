const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigrations() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  APPLY GUIDES TABLE MIGRATIONS                 ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const migrations = [
    {
      name: 'Make profile_id nullable',
      sql: 'ALTER TABLE guides ALTER COLUMN profile_id DROP NOT NULL'
    },
    {
      name: 'Add name column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS name TEXT'
    },
    {
      name: 'Add card_number column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS card_number TEXT'
    },
    {
      name: 'Add expiry_date column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS expiry_date TEXT'
    },
    {
      name: 'Add province_issue column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS province_issue TEXT'
    },
    {
      name: 'Add card_type column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS card_type TEXT'
    },
    {
      name: 'Add language column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS language TEXT'
    },
    {
      name: 'Add experience column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS experience TEXT'
    },
    {
      name: 'Add image_url column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS image_url TEXT'
    },
    {
      name: 'Add source_url column',
      sql: 'ALTER TABLE guides ADD COLUMN IF NOT EXISTS source_url TEXT'
    },
    {
      name: 'Create index on card_number',
      sql: 'CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number)'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`Applying: ${migration.name}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: migration.sql
      });

      if (error) {
        console.error(`  ✗ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✓ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ✗ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              MIGRATION SUMMARY                 ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total migrations:     ${migrations.length}`);
  console.log(`Successful:           ${successCount}`);
  console.log(`Errors:               ${errorCount}`);
  console.log('════════════════════════════════════════════════\n');

  if (errorCount > 0) {
    console.log('Some migrations failed. You may need to apply them manually in Supabase SQL Editor.');
    console.log('See files:');
    console.log('  - supabase/migrations/20250203_make_profile_id_nullable.sql');
    console.log('  - supabase/migrations/20250203_add_guide_csv_columns.sql\n');
  } else {
    console.log('✓ All migrations applied successfully!\n');
  }
}

applyMigrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Process failed:', error);
    process.exit(1);
  });
