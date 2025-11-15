// Test activation status check
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testActivationStatus() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Activation Status Check                     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get a sample guide
    console.log('Fetching sample guide...\n');
    const { data: guides } = await supabase
      .from('guides')
      .select('id, profile_id, name')
      .limit(1);

    if (!guides || guides.length === 0) {
      console.log('❌ No guides found\n');
      return;
    }

    const guide = guides[0];
    console.log(`Sample guide: ${guide.name}`);
    console.log(`Profile ID: ${guide.profile_id}\n`);

    // Check if profile has auth user
    console.log('Checking activation status...\n');
    const { data: authUser, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('id', guide.profile_id)
      .maybeSingle();

    if (error) {
      console.log('Error checking auth user:', error.message);
      console.log('This is expected - auth.users cannot be queried directly from client\n');

      // Try alternative: check if profile has an email
      console.log('Checking profiles table instead...\n');
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', guide.profile_id)
        .single();

      console.log(`Profile email: ${profile?.email || '(none)'}`);
      console.log(`Has email: ${!!profile?.email}\n`);
    } else {
      const isActivated = !!authUser;
      console.log(`✅ Activated: ${isActivated}`);
      console.log(`Auth user exists: ${isActivated ? 'YES' : 'NO'}\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testActivationStatus().catch(console.error);
