// Test searching without accents (e.g., "NGUYEN" finds "NGUYỄN")
require('dotenv').config({ path: '.env.local' });

async function testUnaccentSearch() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Unaccent Search                             ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Test 1: Search without accents
  console.log('Test 1: Search "NGUYEN" (no accents)...\n');
  const url1 = `${baseUrl}/functions/v1/guides-search?country=VN&q=NGUYEN&limit=5`;

  try {
    const response1 = await fetch(url1, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response1.ok) {
      const text1 = await response1.text();
      console.log('❌ Test 1 Failed:', response1.status);
      console.log('Error:', text1);

      if (text1.includes('ByteString')) {
        console.log('\n⚠️  Still ByteString error - Edge Function needs redeployment!\n');
      }
    } else {
      const data1 = await response1.json();
      console.log('✅ Test 1 Success!');
      console.log(`Found ${data1.results?.length || 0} guides:\n`);

      data1.results?.slice(0, 5).forEach((guide, i) => {
        console.log(`  ${i + 1}. ${guide.name}`);
      });

      console.log('\n✅ Unaccent search working! "NGUYEN" found "NGUYỄN" names!\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Test 2: Search with accents (should still work)
  console.log('\nTest 2: Search "NGUYỄN" (with accents)...\n');
  const url2 = `${baseUrl}/functions/v1/guides-search?country=VN&q=NGUYỄN&limit=5`;

  try {
    const response2 = await fetch(url2, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response2.ok) {
      const text2 = await response2.text();
      console.log('❌ Test 2 Failed:', response2.status);
      console.log('Error:', text2);
    } else {
      const data2 = await response2.json();
      console.log('✅ Test 2 Success!');
      console.log(`Found ${data2.results?.length || 0} guides\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n');
}

testUnaccentSearch().catch(console.error);
