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

async function checkLicense(licenseNumber) {
  console.log('\n🔍 Checking license:', licenseNumber);
  console.log('='.repeat(50));

  // Check claim token
  const { data: token, error: tokenError } = await supabase
    .from('profile_claim_tokens')
    .select('*')
    .eq('license_number', licenseNumber.trim())
    .maybeSingle();

  console.log('\n📝 Claim Token:');
  if (tokenError) {
    console.log('❌ Error:', tokenError);
  } else if (!token) {
    console.log('❌ Not found');
  } else {
    console.log('✅ Found:');
    console.log('  - ID:', token.id);
    console.log('  - Profile ID:', token.profile_id);
    console.log('  - License:', token.license_number);
    console.log('  - Claimed at:', token.claimed_at || 'Not claimed');
    console.log('  - Expires at:', token.expires_at);
  }

  if (token) {
    // Check profile - select ALL columns
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', token.profile_id)
      .maybeSingle();

    console.log('\n👤 Profile:');
    if (profileError) {
      console.log('❌ Error:', profileError);
    } else if (!profile) {
      console.log('❌ Not found');
    } else {
      console.log('✅ Found:');
      console.log('\n📋 All columns:');
      Object.keys(profile).sort().forEach(key => {
        const value = profile[key];
        const display = value === null ? '(null)' : value === '' ? '(empty)' : value;
        console.log(`  - ${key}: ${display}`);
      });
    }
  }

  console.log('\n' + '='.repeat(50));
}

checkLicense('122241671');
