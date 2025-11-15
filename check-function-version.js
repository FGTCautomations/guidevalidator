// Check what version of the Edge Function is deployed
require('dotenv').config({ path: '.env.local' });

async function checkVersion() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('\n=== Checking Edge Function Version ===\n');

  // Simple query to check response headers
  const url = `${baseUrl}/functions/v1/guides-search?country=VN&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    console.log('Response status:', response.status);
    console.log('\nResponse headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Function is accessible');
      console.log('Results:', data.results?.length || 0);
    } else {
      const text = await response.text();
      console.log('\n❌ Function error:', text);
    }

    // Check if X-Function-Version header exists (I added this in one version)
    const version = response.headers.get('X-Function-Version');
    if (version) {
      console.log('\n✅ Function version:', version);
    } else {
      console.log('\n⚠️  No version header found - deployment may not have picked up latest code');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n');
}

checkVersion().catch(console.error);
