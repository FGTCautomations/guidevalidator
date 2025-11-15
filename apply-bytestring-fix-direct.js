// Apply guide search ByteString fix directly
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Guide Search ByteString Fix                 ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Read the SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_fix_guide_search_bytestring.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration to database...\n');
    console.log('⚠️  Note: This requires running the SQL in Supabase Dashboard\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/20250214_fix_guide_search_bytestring.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run"\n');

    console.log('SQL Preview (first 1000 chars):');
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 1000) + '...');
    console.log('─'.repeat(60));
    console.log('\n');

    // Test current function to see if fix is needed
    console.log('Testing current api_guides_search function...\n');

    try {
      const { data, error } = await supabase.rpc('api_guides_search', {
        p_country: 'VN',
        p_q: 'NGUYỄN VĂN KIÊN', // Test with Vietnamese characters
        p_limit: 1
      });

      if (error) {
        if (error.message.includes('ByteString')) {
          console.log('❌ ByteString error detected! Migration IS needed.\n');
          console.log('Error:', error.message);
          console.log('\n⚠️  Please apply the migration manually in Supabase Dashboard.\n');
        } else {
          console.log('❌ Different error:', error.message);
        }
      } else {
        console.log('✅ Function works! Migration may already be applied.\n');
        console.log(`Results: ${data?.results?.length || 0}`);
        if (data?.results?.[0]) {
          console.log(`First result: ${data.results[0].name}`);
        }
      }
    } catch (testError) {
      console.log('❌ Test failed:', testError.message);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

applyFix().catch(console.error);
