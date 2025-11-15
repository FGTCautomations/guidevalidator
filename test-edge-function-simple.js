// Test Edge Function with simple query
require('dotenv').config({ path: '.env.local' });

async function testSimple() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('\n=== Testing Edge Function ===\n');

  // Test 1: Simple search without Vietnamese characters
  console.log('Test 1: Simple search (no Vietnamese chars)...\n');
  const url1 = `${baseUrl}/functions/v1/guides-search?country=VN&limit=5`;

  try {
    const response1 = await fetch(url1, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response1.ok) {
      const text1 = await response1.text();
      console.log('❌ Test 1 Failed:', response1.status, text1);
    } else {
      const data1 = await response1.json();
      console.log('✅ Test 1 Success! Results:', data1.results?.length || 0);
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Search with ASCII text
  console.log('\nTest 2: Search with ASCII text "test"...\n');
  const url2 = `${baseUrl}/functions/v1/guides-search?country=VN&q=test&limit=5`;

  try {
    const response2 = await fetch(url2, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response2.ok) {
      const text2 = await response2.text();
      console.log('❌ Test 2 Failed:', response2.status, text2);
    } else {
      const data2 = await response2.json();
      console.log('✅ Test 2 Success! Results:', data2.results?.length || 0);
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Search with properly URL-encoded Vietnamese
  console.log('\nTest 3: Search with URL-encoded Vietnamese...\n');
  const searchTerm = encodeURIComponent('NGUYỄN VĂN KIÊN');
  const url3 = `${baseUrl}/functions/v1/guides-search?country=VN&q=${searchTerm}&limit=5`;

  try {
    const response3 = await fetch(url3, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response3.ok) {
      const text3 = await response3.text();
      console.log('❌ Test 3 Failed:', response3.status, text3);
      if (text3.includes('ByteString')) {
        console.log('\n⚠️  ByteString error persists\n');
      }
    } else {
      const data3 = await response3.json();
      console.log('✅ Test 3 Success! Results:', data3.results?.length || 0);
      if (data3.results?.[0]) {
        console.log('First result:', data3.results[0].name);
      }
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  console.log('\n');
}

testSimple().catch(console.error);
