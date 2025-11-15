// Test guide search for ByteString error
require('dotenv').config({ path: '.env.local' });

async function testGuideSearch() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Guide Search ByteString Error                ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Test 1: Search with Vietnamese characters
  console.log('Test 1: Search with Vietnamese name "NGUYỄN VĂN KIÊN"...\n');

  const url1 = `${baseUrl}/functions/v1/guides-search?country=VN&q=NGUYỄN VĂN KIÊN&limit=5`;

  try {
    const response = await fetch(url1, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Error Response:', response.status, response.statusText);
      console.log('Body:', text);

      if (text.includes('ByteString')) {
        console.log('\n⚠️  ByteString error detected!\n');
      }
    } else {
      const data = await response.json();
      console.log('✅ Success!');
      console.log(`Results: ${data.results?.length || 0}`);
      if (data.results?.[0]) {
        console.log(`First result: ${data.results[0].name}`);
      }
      if (data.nextCursor) {
        console.log(`Next cursor: ${data.nextCursor.substring(0, 20)}...`);

        // Test 2: Use the cursor for pagination
        console.log('\nTest 2: Using pagination cursor...\n');

        const url2 = `${baseUrl}/functions/v1/guides-search?country=VN&cursor=${encodeURIComponent(data.nextCursor)}&limit=5`;

        const response2 = await fetch(url2, {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
          },
        });

        if (!response2.ok) {
          const text2 = await response2.text();
          console.log('❌ Error Response:', response2.status, response2.statusText);
          console.log('Body:', text2);

          if (text2.includes('ByteString')) {
            console.log('\n⚠️  ByteString error in pagination!\n');
          }
        } else {
          const data2 = await response2.json();
          console.log('✅ Pagination works!');
          console.log(`Results: ${data2.results?.length || 0}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }

  console.log('\n');
}

testGuideSearch().catch(console.error);
