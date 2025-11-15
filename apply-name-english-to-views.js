// Apply name_english to materialized views - SIMPLE VERSION
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply name_english to Views Migration            ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('⚠️  IMPORTANT: This migration needs to be applied via SQL Editor\n');
  console.log('Please follow these steps:\n');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Open the file: supabase/migrations/20250214_add_name_english_to_views.sql');
  console.log('3. Copy and paste the entire SQL into the editor');
  console.log('4. Click "Run" to execute\n');

  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_add_name_english_to_views.sql');

  if (fs.existsSync(migrationPath)) {
    console.log(`✅ Migration file exists at: ${migrationPath}\n`);

    // Read and show first few lines
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const lines = sql.split('\n').slice(0, 20);
    console.log('First 20 lines of migration:');
    console.log('─'.repeat(60));
    lines.forEach((line, i) => console.log(`${(i + 1).toString().padStart(3)}: ${line}`));
    console.log('─'.repeat(60));
    console.log(`\n... and ${sql.split('\n').length - 20} more lines\n`);
  } else {
    console.error('❌ Migration file not found!');
    process.exit(1);
  }

  // After migration is applied, test it
  console.log('After applying the migration in Supabase, run this command to test:');
  console.log('  node test-agencies-search.js\n');
}

runMigration().catch(console.error);
