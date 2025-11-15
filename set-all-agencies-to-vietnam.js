// Set all agencies to Vietnam (VN)
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setAllToVietnam() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Set All Agencies to Vietnam                      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Get count of agencies without country_code
  const { data: noCountry, error: countError } = await supabase
    .from('agencies')
    .select('id', { count: 'exact', head: true })
    .is('country_code', null)
    .is('deleted_at', null);

  if (countError) {
    console.error('Error counting agencies:', countError);
    return;
  }

  console.log(`Agencies without country_code: ${noCountry?.length || 0}\n`);

  // Update all agencies to VN
  console.log('Setting all agencies to country_code = VN...\n');

  const { data, error } = await supabase
    .from('agencies')
    .update({ country_code: 'VN' })
    .is('deleted_at', null);

  if (error) {
    console.error('❌ Error updating agencies:', error);
    return;
  }

  console.log('✅ Successfully updated all agencies to Vietnam!\n');

  // Verify
  const { count } = await supabase
    .from('agencies')
    .select('*', { count: 'exact', head: true })
    .eq('country_code', 'VN')
    .is('deleted_at', null);

  console.log(`Total agencies with country_code = VN: ${count}\n`);

  // Now refresh the materialized view
  console.log('Refreshing materialized view...\n');

  const { error: refreshError } = await supabase.rpc('exec_sql', {
    sql_query: 'REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;'
  });

  if (refreshError) {
    console.log('Note: Could not refresh view automatically.');
    console.log('Please run this in Supabase SQL Editor:');
    console.log('  REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;\n');
  } else {
    console.log('✅ Materialized view refreshed!\n');
  }

  console.log('✅ All done! All agencies are now set to Vietnam.\n');
}

setAllToVietnam().catch(console.error);
