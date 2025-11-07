// Test Edge Functions for agencies, DMCs, and transport

const SUPABASE_URL = 'https://vhqzmunorymtoisijiqb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testEdgeFunction(functionName: string, params: Record<string, any>) {
  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  console.log(`\n=== Testing ${functionName} ===`);
  console.log(`URL: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Error ${response.status}: ${text}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Success!`);
    console.log(`   Results: ${data.results?.length || 0} items`);
    console.log(`   Next cursor: ${data.nextCursor || 'none'}`);

    if (data.results && data.results.length > 0) {
      console.log(`   Sample: ${data.results[0].name} (${data.results[0].country})`);
    }

    if (data.facets) {
      const languageCount = Object.keys(data.facets.languages || {}).length;
      const otherFacetKey = Object.keys(data.facets).find(k => k !== 'languages');
      const otherCount = otherFacetKey ? Object.keys(data.facets[otherFacetKey] || {}).length : 0;
      console.log(`   Facets: ${languageCount} languages, ${otherCount} ${otherFacetKey || 'other'}`);
    }

    return data;
  } catch (error: any) {
    console.error(`❌ Exception: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Testing Edge Functions...\n');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing');

  // Test agencies-search
  await testEdgeFunction('agencies-search', {
    country: 'US',
    limit: 5,
  });

  // Test dmcs-search
  await testEdgeFunction('dmcs-search', {
    country: 'FR',
    limit: 5,
  });

  // Test transport-search
  await testEdgeFunction('transport-search', {
    country: 'FR',
    limit: 5,
  });

  // Test without country filter
  console.log('\n\n=== Testing without country filter ===');

  await testEdgeFunction('agencies-search', {
    limit: 10,
  });

  await testEdgeFunction('dmcs-search', {
    limit: 10,
  });

  await testEdgeFunction('transport-search', {
    limit: 10,
  });
}

main().catch(console.error);
