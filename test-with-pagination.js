// Test to see if error is from cursor or from query
require('dotenv').config({ path: '.env.local' });

async function testPagination() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('\n=== Testing ByteString Error Source ===\n');

  // Test 1: Vietnamese search WITHOUT cursor
  console.log('Test 1: Vietnamese search (no cursor)...\n');
  const url1 = `${baseUrl}/functions/v1/guides-search?country=VN&q=NGUYỄN&limit=5`;

  try {
    const response1 = await fetch(url1, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response1.ok) {
      const text1 = await response1.text();
      console.log('❌ Test 1 Failed:', response1.status);
      console.log('Error:', text1);
    } else {
      const data1 = await response1.json();
      console.log('✅ Test 1 Success!');
      console.log('Results:', data1.results?.length || 0);
      console.log('Next cursor exists:', !!data1.nextCursor);

      if (data1.nextCursor) {
        console.log('Cursor preview:', data1.nextCursor.substring(0, 50) + '...');

        // Test 2: Use the cursor with Vietnamese characters
        console.log('\nTest 2: Pagination WITH cursor...\n');
        const url2 = `${baseUrl}/functions/v1/guides-search?country=VN&cursor=${encodeURIComponent(data1.nextCursor)}&limit=5`;

        const response2 = await fetch(url2, {
          headers: { 'Authorization': `Bearer ${anonKey}` },
        });

        if (!response2.ok) {
          const text2 = await response2.text();
          console.log('❌ Test 2 Failed (cursor):', response2.status);
          console.log('Error:', text2);
          if (text2.includes('ByteString')) {
            console.log('\n⚠️  ByteString error is FROM THE CURSOR!\n');
          }
        } else {
          const data2 = await response2.json();
          console.log('✅ Test 2 Success (pagination works)!');
          console.log('Results:', data2.results?.length || 0);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n');
}

testPagination().catch(console.error);
