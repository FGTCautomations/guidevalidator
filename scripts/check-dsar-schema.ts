/**
 * Check DSAR Requests Table Schema
 *
 * This script checks the schema of the existing dsar_requests table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('🔍 Checking dsar_requests table schema...\n');

  // Try to get the table structure from information_schema
  const { data: columns, error: columnsError } = await client
    .rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dsar_requests'
        ORDER BY ordinal_position;
      `
    });

  if (columnsError) {
    console.log('⚠️  Cannot query information_schema via RPC');
    console.log('Trying alternative method...\n');

    // Alternative: Try to select from the table to see what columns exist
    const { data, error } = await client
      .from('dsar_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n💡 This suggests the table exists but has issues.');
    } else {
      console.log('✅ Table exists and is accessible');
      if (data && data.length > 0) {
        console.log('\n📋 Columns found:');
        Object.keys(data[0]).forEach(col => {
          console.log(`  - ${col}`);
        });
      } else {
        console.log('\n📋 Table is empty, cannot determine columns from data.');
        console.log('Attempting to insert a test record to see what columns are expected...');
      }
    }
  } else {
    console.log('✅ Table schema retrieved:\n');
    console.log(columns);
  }

  // Check if user_id column exists specifically
  console.log('\n🔍 Checking specifically for user_id column...');
  const { data: userIdCheck, error: userIdError } = await client
    .from('dsar_requests')
    .select('user_id')
    .limit(1);

  if (userIdError) {
    console.log(`❌ user_id column NOT FOUND: ${userIdError.message}`);
  } else {
    console.log('✅ user_id column EXISTS');
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
