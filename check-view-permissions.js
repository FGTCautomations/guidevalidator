const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkPermissions() {
  console.log('🔐 Checking view permissions...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Direct view access
    console.log('Test 1: Direct agencies_browse_v access (as anon)');
    const { data: viewData, error: viewError } = await supabase
      .from('agencies_browse_v')
      .select('id, name, country_code')
      .eq('country_code', 'VN')
      .limit(5);

    if (viewError) {
      console.error('❌ Error accessing view:', viewError.message);
      console.error('   Code:', viewError.code);
      console.error('   Details:', viewError.details);
    } else {
      console.log(`✅ View accessible! Found ${viewData.length} results`);
      if (viewData.length > 0) {
        console.log(`   First: ${viewData[0].name}`);
      }
    }

    // Test 2: Check if active column exists
    console.log('\nTest 2: Check active column in agencies table');
    const { data: agenciesData, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, name, active, application_status, type')
      .eq('country_code', 'VN')
      .eq('type', 'agency')
      .limit(5);

    if (agenciesError) {
      console.error('❌ Error accessing agencies:', agenciesError.message);
    } else {
      console.log(`✅ Agencies table accessible! Found ${agenciesData.length} results`);
      if (agenciesData.length > 0) {
        console.log(`   Sample: ${agenciesData[0].name}`);
        console.log(`   Active: ${agenciesData[0].active}`);
        console.log(`   Status: ${agenciesData[0].application_status}`);
      }
    }

    // Test 3: Count active agencies
    console.log('\nTest 3: Count active agencies');
    const { count, error: countError } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN')
      .eq('type', 'agency')
      .eq('active', true);

    if (countError) {
      console.error('❌ Error counting:', countError.message);
    } else {
      console.log(`✅ Active agencies count: ${count}`);
    }

    // Test 4: Check materialized view directly
    console.log('\nTest 4: Count in materialized view');
    const { count: viewCount, error: viewCountError } = await supabase
      .from('agencies_browse_v')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN');

    if (viewCountError) {
      console.error('❌ Error counting view:', viewCountError.message);
    } else {
      console.log(`✅ View count: ${viewCount}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

checkPermissions();
