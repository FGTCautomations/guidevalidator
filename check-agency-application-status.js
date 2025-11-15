// Check agencies by application_status
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('Checking agency application status counts...\n');

  const { data, error } = await supabase
    .from('agencies')
    .select('application_status')
    .eq('type', 'agency')
    .is('deleted_at', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Count by status
  const counts = {};
  data.forEach(row => {
    const status = row.application_status || 'null';
    counts[status] = (counts[status] || 0) + 1;
  });

  console.log('Application Status Counts:');
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

  console.log(`\nTotal: ${data.length}`);

  // Check country_code
  const { data: countryData } = await supabase
    .from('agencies')
    .select('country_code, application_status')
    .eq('type', 'agency')
    .is('deleted_at', null)
    .eq('country_code', 'VN');

  console.log(`\nAgencies with country_code = 'VN': ${countryData?.length || 0}`);

  if (countryData) {
    const vnCounts = {};
    countryData.forEach(row => {
      const status = row.application_status || 'null';
      vnCounts[status] = (vnCounts[status] || 0) + 1;
    });

    console.log('VN Agencies by Status:');
    Object.entries(vnCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
  }
}

checkStatus().catch(console.error);
