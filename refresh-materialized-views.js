const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshViews() {
  console.log('🔄 Refreshing materialized views...\n');

  try {
    // Check current state
    console.log('📊 Checking current state of agencies...\n');

    const { count: totalAgencies } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN')
      .eq('type', 'agency');

    console.log(`Total Vietnamese agencies in table: ${totalAgencies}`);

    const { count: activeAgencies } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN')
      .eq('type', 'agency')
      .eq('active', true);

    console.log(`Active Vietnamese agencies: ${activeAgencies}`);

    // Check view before refresh
    const { count: viewCountBefore } = await supabase
      .from('agencies_browse_v')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN');

    console.log(`Agencies in view (before refresh): ${viewCountBefore}\n`);

    // Refresh all materialized views
    console.log('🔄 Refreshing agencies_browse_v...');
    const { error: error1 } = await supabase.rpc('refresh_agencies_view');
    if (error1) {
      console.error('❌ Error refreshing agencies view:', error1.message);
      console.log('Trying alternative method...');
      // Try direct SQL if RPC doesn't exist
      const { error: altError1 } = await supabase.rpc('exec_sql', {
        sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v'
      });
      if (altError1) console.error('Alternative method also failed:', altError1.message);
    } else {
      console.log('✅ agencies_browse_v refreshed');
    }

    console.log('🔄 Refreshing dmcs_browse_v...');
    const { error: error2 } = await supabase.rpc('refresh_dmcs_view');
    if (error2) {
      console.error('⚠️  Error refreshing dmcs view:', error2.message);
    } else {
      console.log('✅ dmcs_browse_v refreshed');
    }

    console.log('🔄 Refreshing transport_browse_v...');
    const { error: error3 } = await supabase.rpc('refresh_transport_view');
    if (error3) {
      console.error('⚠️  Error refreshing transport view:', error3.message);
    } else {
      console.log('✅ transport_browse_v refreshed');
    }

    // Check view after refresh
    console.log('\n📊 Checking view after refresh...');
    const { count: viewCountAfter } = await supabase
      .from('agencies_browse_v')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN');

    console.log(`Agencies in view (after refresh): ${viewCountAfter}`);

    // Test the RPC function
    console.log('\n🧪 Testing api_agencies_search RPC function...');
    const { data: searchResults, error: searchError } = await supabase.rpc('api_agencies_search', {
      p_country: 'VN',
      p_limit: 5
    });

    if (searchError) {
      console.error('❌ RPC function error:', searchError);
    } else {
      console.log(`✅ RPC function works! Found ${searchResults?.results?.length || 0} results`);
      if (searchResults?.results?.length > 0) {
        console.log('\nSample result:');
        console.log('  -', searchResults.results[0].name);
      }
    }

    console.log('\n✅ ALL DONE!');
    console.log('\n📝 Summary:');
    console.log(`  - Total agencies in DB: ${totalAgencies}`);
    console.log(`  - Active agencies: ${activeAgencies}`);
    console.log(`  - Agencies in view: ${viewCountAfter}`);
    console.log(`  - RPC function: ${searchError ? '❌ ERROR' : '✅ WORKING'}`);

    if (viewCountAfter === 0) {
      console.log('\n⚠️  WARNING: View has 0 records!');
      console.log('   This means the materialized view might be using the wrong filter.');
      console.log('   Check that the migration 20250214_add_active_and_update_views.sql was run.');
    }

    console.log('\n🌐 Test the directory at:');
    console.log('   http://localhost:3000/directory/agencies?country=VN');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

refreshViews();
