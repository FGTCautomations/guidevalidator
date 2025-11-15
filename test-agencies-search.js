// Test agencies search API
require('dotenv').config({ path: '.env.local' });

async function testSearch() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agencies-search?country=VN&limit=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    console.error('Error:', response.status, response.statusText);
    const text = await response.text();
    console.error(text);
    return;
  }

  const data = await response.json();

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     Agencies Search API Test                      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('Results count:', data.results?.length || 0);
  console.log('Total from facets:', data.facets?.total || 0);
  console.log('Has next cursor:', !!data.nextCursor);
  console.log('\nFirst 5 results:');
  (data.results || []).slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name_english || r.name}`);
  });
}

testSearch().catch(console.error);
