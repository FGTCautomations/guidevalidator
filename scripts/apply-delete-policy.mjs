#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251007000000_add_profiles_delete_policy.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration to add profiles DELETE policy...');

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error applying migration:', error);

      // Try alternative method using raw SQL
      console.log('🔄 Trying alternative method...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        console.error('❌ Alternative method also failed');
        console.log('⚠️  You may need to apply this migration manually in the Supabase dashboard');
        console.log('\nMigration SQL:');
        console.log(migrationSQL);
        process.exit(1);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ Admins can now delete profiles from the admin panel');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Manual migration required. Please run this SQL in Supabase dashboard:');
    console.log('\n' + readFileSync(join(__dirname, '..', 'supabase', 'migrations', '20251007000000_add_profiles_delete_policy.sql'), 'utf8'));
    process.exit(1);
  }
}

applyMigration();
