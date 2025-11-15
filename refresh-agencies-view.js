// Refresh materialized view
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshView() {
  console.log('\nRefreshing agencies_browse_v...\n');

  // Try direct SQL query
  const { data, error } = await supabase
    .rpc('refresh_materialized_view', { view_name: 'agencies_browse_v' });

  if (error) {
    console.log('Could not refresh via RPC, trying alternative method...\n');

    // Alternative: Use postgREST API to execute raw SQL
    const refreshSQL = `
      REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
      REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
      REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;
    `;

    console.log('Please run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(refreshSQL);
    console.log('\nOr wait 5 minutes - views refresh automatically.\n');
  } else {
    console.log('✅ View refreshed successfully!\n');
  }
}

refreshView().catch(console.error);
