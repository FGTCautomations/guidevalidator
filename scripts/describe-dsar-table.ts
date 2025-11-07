/**
 * Describe DSAR Requests Table
 *
 * Uses raw SQL to describe the table structure
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function describeTable() {
  console.log('🔍 Getting dsar_requests table structure via direct SQL...\n');

  try {
    // Use fetch to call the PostgREST API with a custom query
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          query: `
            SELECT
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'dsar_requests'
            ORDER BY ordinal_position;
          `
        })
      }
    );

    if (!response.ok) {
      console.log('⚠️  exec_sql RPC not available, trying direct psql connection...\n');

      // Try to use psql directly if available
      const { spawn } = await import('child_process');
      const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

      if (!dbUrl) {
        console.log('❌ No database connection URL found');
        console.log('\n💡 MANUAL STEPS REQUIRED:');
        console.log('1. Go to Supabase SQL Editor');
        console.log('2. Run this query:');
        console.log('   \\d dsar_requests');
        console.log('\nOr run:');
        console.log(`   SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'dsar_requests'
           ORDER BY ordinal_position;`);
        return;
      }

      console.log('Using database URL to connect...');
    } else {
      const result = await response.json();
      console.log('✅ Table structure:\n');
      console.table(result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Please manually check the table structure in Supabase SQL Editor:');
    console.log('Run: \\d dsar_requests');
  }
}

describeTable()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
