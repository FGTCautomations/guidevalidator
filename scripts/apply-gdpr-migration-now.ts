/**
 * Apply GDPR Migration NOW
 *
 * This script applies the GDPR migration by executing the SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('📝 Reading GDPR migration file...\n');

  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251006000000_gdpr_ccpa_compliance.sql'
  );

  const migration = fs.readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying GDPR migration via RPC...\n');

  // Try to apply using rpc
  try {
    // Note: Supabase doesn't allow direct SQL execution via client library
    // The user needs to do this manually in SQL Editor
    console.log('⚠️  Cannot apply migration automatically via JavaScript.');
    console.log('');
    console.log('📋 MANUAL STEPS REQUIRED:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   👉 https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
    console.log('');
    console.log('2. Copy the migration file content:');
    console.log('   📁 File: supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql');
    console.log('');
    console.log('3. Paste into SQL Editor');
    console.log('');
    console.log('4. Click "Run" button');
    console.log('');
    console.log('5. Verify success:');
    console.log('   npx tsx scripts/check-gdpr-tables.ts');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✨ Migration Preview (first 50 lines):');
    console.log('───────────────────────────────────────────────────────────────');
    const lines = migration.split('\n').slice(0, 50);
    console.log(lines.join('\n'));
    console.log('...');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`📊 Total lines: ${migration.split('\n').length}`);
    console.log('');

    // Create a file ready for copy-paste
    const readyPath = path.join(process.cwd(), 'COPY_THIS_TO_SUPABASE.sql');
    fs.writeFileSync(readyPath, migration);
    console.log(`✅ Migration saved to: ${readyPath}`);
    console.log('   You can copy this file and paste it into Supabase SQL Editor!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
