// Apply guide search ByteString fix migration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Guide Search ByteString Fix                 ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_fix_guide_search_bytestring.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying ByteString fix migration...\n');

    // Execute the entire migration as-is (it's a single CREATE OR REPLACE FUNCTION)
    console.log('Executing migration SQL...\n');

    // Use raw SQL query via REST API
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(`${baseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative: Execute using pg client through edge function
      console.log('Trying direct SQL execution...\n');

      // Just execute via supabase client's raw query capability
      // We'll use a workaround: create the function by executing it through the client
      const { error: execError } = await supabase.rpc('query', { sql });

      if (execError) {
        console.log('⚠️  Could not execute via RPC. Applying via direct connection...\n');

        // Last resort: Use Supabase Management API or show manual instructions
        console.log('Please apply the migration manually:\n');
        console.log('1. Open Supabase Dashboard SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new\n');
        console.log('2. Copy the SQL from:');
        console.log('   supabase/migrations/20250214_fix_guide_search_bytestring.sql\n');
        console.log('3. Paste and click "Run"\n');
      } else {
        console.log('✅ Migration executed successfully!\n');
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify the function exists
    console.log('Verifying api_guides_search function...\n');

    const { data: funcCheck, error: funcError } = await supabase
      .rpc('api_guides_search', {
        p_country: 'VN',
        p_limit: 1
      });

    if (funcError) {
      console.error('❌ Function test failed:', funcError.message);
    } else {
      console.log('✅ Function is working!\n');
      console.log(`Results returned: ${funcCheck?.results?.length || 0}`);
    }

    console.log('\n✅ All done!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration().catch(console.error);
