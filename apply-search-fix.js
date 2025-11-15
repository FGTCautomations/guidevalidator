// Script to apply guide search ByteString fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: { schema: 'public' }
});

async function applySQLFix() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  FIX: ByteString Error in Guide Search          ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('This fix adds better error handling for special characters in search.');
  console.log('The SQL migration file is ready at:');
  console.log('supabase/migrations/20250214_fix_guide_search_bytestring.sql\n');

  console.log('📋 Please run this SQL in Supabase SQL Editor:');
  console.log('────────────────────────────────────────────────────────\n');

  console.log('Go to: https://supabase.com/dashboard');
  console.log('Then: SQL Editor > New Query > Paste the migration file\n');

  console.log('Or you can test the search function directly:\n');

  // Test if the current function works
  try {
    console.log('🔍 Testing current search with Vietnamese characters...\n');

    const { data, error } = await supabase.rpc('api_guides_search', {
      p_country: 'VN',
      p_q: 'NGUYỄN VĂN KIÊN',
      p_limit: 5
    });

    if (error) {
      console.log('❌ Error (expected before fix):');
      console.log('  ', error.message);
      console.log('\n✓ This confirms the issue. Please apply the migration.\n');
    } else {
      console.log('✅ Search works! The fix may already be applied.');
      console.log(`   Found ${data.facets?.total || 0} results.\n`);
    }
  } catch (err) {
    console.log('❌ Error testing search:', err.message);
    console.log('\n✓ Please apply the migration to fix this.\n');
  }
}

applySQLFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
