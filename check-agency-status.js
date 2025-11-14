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

async function checkAgencyStatus() {
  console.log('Checking agencies in database...\n');

  // Check all agencies
  const { data: agencies, error } = await supabase
    .from('agencies')
    .select('id, name, type, application_status, verified, created_at')
    .eq('type', 'agency')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching agencies:', error);
    return;
  }

  if (!agencies || agencies.length === 0) {
    console.log('No agencies found in database.');
    return;
  }

  console.log(`Found ${agencies.length} agencies:\n`);
  agencies.forEach((agency, i) => {
    console.log(`${i + 1}. ${agency.name}`);
    console.log(`   ID: ${agency.id}`);
    console.log(`   Status: ${agency.application_status}`);
    console.log(`   Verified: ${agency.verified}`);
    console.log(`   Created: ${agency.created_at}`);
    console.log('');
  });

  // Check for recently approved agencies
  const approvedAgencies = agencies.filter(a => a.application_status === 'approved');
  console.log(`\nApproved agencies: ${approvedAgencies.length}`);

  if (approvedAgencies.length > 0) {
    console.log('✅ Approved agencies exist and should appear in /admin/users page');
  } else {
    console.log('⚠️ No approved agencies found - they may still be pending');
  }
}

checkAgencyStatus();
