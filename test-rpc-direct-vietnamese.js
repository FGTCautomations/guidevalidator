// Test RPC function directly with Vietnamese query
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPC() {
  console.log('\n=== Testing RPC Direct with Service Role ===\n');

  // Test with Vietnamese characters
  console.log('Calling api_guides_search with Vietnamese query...\n');

  const { data, error } = await supabase.rpc('api_guides_search', {
    p_country: 'VN',
    p_q: 'NGUYỄN VĂN KIÊN',
    p_limit: 5
  });

  if (error) {
    console.error('❌ RPC Error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ RPC Success!');
    console.log('Results:', data.results?.length || 0);
    console.log('\nFirst result:');
    if (data.results?.[0]) {
      console.log(JSON.stringify(data.results[0], null, 2));
    }
    console.log('\nNext cursor:', data.nextCursor?.substring(0, 50) + '...');
  }
}

testRPC().catch(console.error);
