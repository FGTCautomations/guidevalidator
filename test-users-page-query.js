require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUsersPageQuery() {
  console.log('Testing the exact query from /admin/users page...\n');

  // This is the EXACT query from app/[locale]/admin/users/page.tsx
  const { data: agencies, error: agenciesError } = await supabase
    .from("agencies")
    .select("*")
    .eq("type", "agency")
    .order("created_at", { ascending: false });

  console.log('=== AGENCIES QUERY RESULT ===');
  if (agenciesError) {
    console.error('ERROR:', agenciesError);
  } else {
    console.log(`Success! Found ${agencies?.length || 0} agencies`);
    if (agencies && agencies.length > 0) {
      agencies.forEach((agency, i) => {
        console.log(`\n${i + 1}. ${agency.name}`);
        console.log(`   ID: ${agency.id}`);
        console.log(`   Type: ${agency.type}`);
        console.log(`   Status: ${agency.application_status}`);
        console.log(`   Verified: ${agency.verified}`);
        console.log(`   Email: ${agency.contact_email}`);
      });
    }
  }

  // Also check guides query
  const { data: guides, error: guidesError } = await supabase
    .from("guides")
    .select(`
      *,
      profiles!inner(
        id,
        full_name,
        email,
        role,
        country_code,
        timezone,
        avatar_url,
        verified,
        license_verified,
        application_status,
        application_submitted_at,
        application_reviewed_at,
        application_reviewed_by,
        rejection_reason,
        created_at,
        updated_at
      )
    `)
    .order("created_at", { ascending: false });

  console.log('\n\n=== GUIDES QUERY RESULT ===');
  if (guidesError) {
    console.error('ERROR:', guidesError);
  } else {
    console.log(`Success! Found ${guides?.length || 0} guides`);
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`Agencies query: ${agenciesError ? '❌ ERROR' : '✅ SUCCESS'} (${agencies?.length || 0} results)`);
  console.log(`Guides query: ${guidesError ? '❌ ERROR' : '✅ SUCCESS'} (${guides?.length || 0} results)`);

  if (!agenciesError && agencies && agencies.length > 0) {
    console.log('\n✅ Agency data is being returned correctly by the query!');
    console.log('   The issue is likely in how the page is rendering or a cache issue.');
    console.log('   Try:');
    console.log('   1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   2. Clear browser cache');
    console.log('   3. Open the page in incognito mode');
  }
}

testUsersPageQuery();
