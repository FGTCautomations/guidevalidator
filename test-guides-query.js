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

async function testGuidesQuery() {
  console.log('Testing guides queries...\n');

  // Test 1: Check guides table
  const { data: guidesData, error: guidesError } = await supabase
    .from('guides')
    .select('profile_id, headline, license_number')
    .limit(5);

  console.log('=== GUIDES TABLE ===');
  if (guidesError) {
    console.error('ERROR:', guidesError);
  } else {
    console.log(`Found ${guidesData?.length || 0} guides in table`);
    if (guidesData && guidesData.length > 0) {
      guidesData.forEach((g, i) => {
        console.log(`  ${i + 1}. Profile ID: ${g.profile_id.slice(0, 8)}... | License: ${g.license_number || 'N/A'}`);
      });
    }
  }

  // Test 2: Check profiles table
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'guide')
    .limit(5);

  console.log('\n=== PROFILES TABLE (role=guide) ===');
  if (profilesError) {
    console.error('ERROR:', profilesError);
  } else {
    console.log(`Found ${profilesData?.length || 0} guide profiles`);
    if (profilesData && profilesData.length > 0) {
      profilesData.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.full_name} (${p.id.slice(0, 8)}...)`);
      });
    }
  }

  // Test 3: Join query (what admin/users page uses)
  const { data: joinData, error: joinError } = await supabase
    .from('guides')
    .select(`
      profile_id,
      headline,
      license_number,
      profiles!inner(
        id,
        full_name,
        role
      )
    `)
    .limit(5);

  console.log('\n=== JOIN QUERY (guides with profiles) ===');
  if (joinError) {
    console.error('ERROR:', joinError);
  } else {
    console.log(`Found ${joinData?.length || 0} guides with profiles`);
    if (joinData && joinData.length > 0) {
      joinData.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.profiles?.full_name} | License: ${g.license_number || 'N/A'}`);
      });
    }
  }

  // Test 4: Check materialized view
  const { data: browseData, error: browseError } = await supabase
    .from('guides_browse_v')
    .select('profile_id, full_name, license_number')
    .limit(5);

  console.log('\n=== MATERIALIZED VIEW (guides_browse_v) ===');
  if (browseError) {
    console.error('ERROR:', browseError);
  } else {
    console.log(`Found ${browseData?.length || 0} guides in materialized view`);
    if (browseData && browseData.length > 0) {
      browseData.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.full_name} | License: ${g.license_number || 'N/A'}`);
      });
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Guides table: ${guidesData?.length || 0} records`);
  console.log(`Profiles (role=guide): ${profilesData?.length || 0} records`);
  console.log(`Join query: ${joinData?.length || 0} records`);
  console.log(`Materialized view: ${browseData?.length || 0} records`);
}

testGuidesQuery();
