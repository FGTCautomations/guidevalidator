/**
 * Check GDPR Tables
 *
 * Simple script to check if GDPR tables exist
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
  console.log('🔍 Checking GDPR tables...\n');

  const tables = ['user_consents', 'dsar_requests', 'archived_accounts', 'gdpr_audit_log'];
  const results = [];

  for (const table of tables) {
    const { data, error } = await client
      .from(table)
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log(`❌ ${table} - NOT FOUND`);
        results.push({ table, exists: false });
      } else {
        console.log(`⚠️  ${table} - Error: ${error.message}`);
        results.push({ table, exists: false, error: error.message });
      }
    } else {
      console.log(`✅ ${table} - EXISTS`);
      results.push({ table, exists: true });
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════');

  const existing = results.filter(r => r.exists).length;
  const missing = results.filter(r => !r.exists).length;

  console.log(`✅ Existing: ${existing}/${tables.length}`);
  console.log(`❌ Missing: ${missing}/${tables.length}`);

  if (missing > 0) {
    console.log('\n📝 TO FIX:');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
    console.log('');
    console.log('2. Copy this file:');
    console.log('   supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql');
    console.log('');
    console.log('3. Paste and click "Run"');
    console.log('');
    console.log('4. Refresh your app - 404 errors gone!');
  } else {
    console.log('\n🎉 All GDPR tables exist! No action needed.');
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
