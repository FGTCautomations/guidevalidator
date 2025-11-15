// Test license number search via Edge Function
require('dotenv').config({ path: '.env.local' });

async function testLicenseSearch() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test License Number Search                       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Test 1: Search by license number
  console.log('Test 1: Search by license number "101100116"...\n');
  const url1 = `${baseUrl}/functions/v1/guides-search?country=VN&q=101100116&limit=5`;

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
      console.log(`Found ${data1.results?.length || 0} guides:\n`);

      data1.results?.forEach((guide, i) => {
        console.log(`  ${i + 1}. ${guide.name}`);
      });

      if (data1.results?.length > 0) {
        console.log('\n✅ License number search working!\n');
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Test 2: Search by partial license number
  console.log('\nTest 2: Search by partial license "1011"...\n');
  const url2 = `${baseUrl}/functions/v1/guides-search?country=VN&q=1011&limit=5`;

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
      console.log(`Found ${data2.results?.length || 0} guides with license containing "1011"\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Test 3: Search by name (should still work)
  console.log('\nTest 3: Search by name "NGUYEN"...\n');
  const url3 = `${baseUrl}/functions/v1/guides-search?country=VN&q=NGUYEN&limit=5`;

  try {
    const response3 = await fetch(url3, {
      headers: { 'Authorization': `Bearer ${anonKey}` },
    });

    if (!response3.ok) {
      const text3 = await response3.text();
      console.log('❌ Test 3 Failed:', response3.status);
      console.log('Error:', text3);
    } else {
      const data3 = await response3.json();
      console.log('✅ Test 3 Success!');
      console.log(`Found ${data3.results?.length || 0} guides with name "NGUYEN"\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n');
}

testLicenseSearch().catch(console.error);
