const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function directly...\n');

  try {
    const url = `${supabaseUrl}/functions/v1/agencies-search?country=VN&limit=5`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      }
    });

    if (!response.ok) {
      console.error('❌ Edge Function error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const data = await response.json();

    console.log('✅ Edge Function Response:');
    console.log(`  - Results count: ${data?.results?.length || 0}`);
    console.log(`  - Has facets: ${!!data?.facets}`);
    console.log(`  - Next cursor: ${data?.nextCursor || 'none'}`);

    if (data?.results?.length > 0) {
      console.log('\n📋 First result:');
      console.log(`  - Name: ${data.results[0].name}`);
      console.log(`  - Country: ${data.results[0].country}`);
      console.log(`  - Verified: ${data.results[0].verified}`);
    } else {
      console.log('\n⚠️  No results returned from Edge Function');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

    // Also test the direct RPC call
    console.log('\n🧪 Testing RPC function directly...\n');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: rpcData, error: rpcError } = await supabase.rpc('api_agencies_search', {
      p_country: 'VN',
      p_limit: 5
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC Response:');
      console.log(`  - Results count: ${rpcData?.results?.length || 0}`);
      if (rpcData?.results?.length > 0) {
        console.log(`  - First result: ${rpcData.results[0].name}`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

testEdgeFunction();
