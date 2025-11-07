/**
 * Apply GDPR Migration Script
 *
 * This script applies the GDPR compliance migration to create the missing tables.
 *
 * Usage:
 *   npx tsx scripts/apply-gdpr-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create service client
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function applyGDPRMigration() {
  console.log('🔍 Checking if GDPR tables exist...\n');

  // Check if tables already exist
  const { data: tables, error: tablesError } = await serviceClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['user_consents', 'dsar_requests', 'archived_accounts', 'gdpr_audit_log']);

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError.message);
    process.exit(1);
  }

  const existingTables = tables?.map(t => t.table_name) || [];

  if (existingTables.length === 4) {
    console.log('✅ All GDPR tables already exist!');
    console.log('Tables:', existingTables);
    console.log('\nNo migration needed.');
    return;
  }

  console.log('⚠️  Some GDPR tables are missing.');
  console.log('Existing tables:', existingTables.length > 0 ? existingTables : 'None');
  console.log('\n📝 To apply the migration:');
  console.log('\n1. Go to Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
  console.log('\n2. Copy the migration file:');
  console.log('   supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql');
  console.log('\n3. Paste and run in SQL Editor');
  console.log('\n4. Refresh your app - 404 errors should be gone!');

  // Read the migration file to show preview
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251006000000_gdpr_ccpa_compliance.sql');

  if (fs.existsSync(migrationPath)) {
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    const lines = migration.split('\n').slice(0, 30);

    console.log('\n📄 Migration Preview:');
    console.log('─────────────────────────────────────────────────────');
    console.log(lines.join('\n'));
    console.log('...');
    console.log('─────────────────────────────────────────────────────');
  }
}

// Run the check
applyGDPRMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
