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

async function testAgencySignup() {
  const testEmail = `test-agency-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('Testing agency signup...');
  console.log('Email:', testEmail);

  try {
    // Try to create a user with the same metadata structure
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      ban_duration: '876000h',
      user_metadata: {
        full_name: 'Test Agency Ltd',
        role: 'agency',
        pending_approval: true,
        timezone: 'UTC',
        subscription_plan: 'free',
      },
    });

    if (authError) {
      console.error('\n❌ Auth error:', authError);
      console.error('\nError details:', JSON.stringify(authError, null, 2));
      return;
    }

    const userId = authData.user?.id;
    console.log('\n✅ User created successfully!');
    console.log('User ID:', userId);

    // Clean up - delete the test user
    if (userId) {
      console.log('\nCleaning up test user...');
      await supabase.auth.admin.deleteUser(userId);
      console.log('✅ Test user deleted');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    console.error('\nError stack:', error.stack);
  }
}

testAgencySignup();
