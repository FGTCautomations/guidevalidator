/**
 * Database Schema Checker
 * Run with: node scripts/check-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Try to query with new fields
  const { data, error } = await supabase
    .from('guide_applications')
    .select('id, user_id, timezone, availability_timezone, working_hours, avatar_url, login_email')
    .limit(1);

  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.error('❌ Migration NOT run - columns missing:');
      console.error('Error:', error.message);
      console.error('\n📋 Please run APPLY_THIS_MIGRATION.sql in Supabase SQL Editor:');
      console.error('https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
      process.exit(1);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  console.log('✅ All new columns exist - migration has been run successfully!');
  console.log('\n📊 Sample query result:', data);
}

checkSchema().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
