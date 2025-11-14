const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function getTestLicenseNumbers() {
  const { data, error } = await supabase
    .from('profile_claim_tokens')
    .select('license_number, profile_id')
    .is('claimed_at', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Test License Numbers (unclaimed):');
  console.log('=====================================\n');

  for (const token of data) {
    // Get profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', token.profile_id)
      .single();

    console.log(`License: ${token.license_number}`);
    console.log(`Name: ${profile?.full_name || 'N/A'}`);
    console.log('---');
  }
}

getTestLicenseNumbers();
