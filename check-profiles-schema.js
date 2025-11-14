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

async function checkProfilesSchema() {
  console.log('Checking profiles table schema...\n');

  // Get a sample profile to see available columns
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying profiles:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No profiles found in database.');
    return;
  }

  console.log('Available columns in profiles table:');
  const columns = Object.keys(data[0]);
  columns.forEach(col => {
    console.log(`  - ${col}: ${typeof data[0][col]} (value: ${JSON.stringify(data[0][col])})`);
  });

  console.log('\n\nChecking if email column exists:');
  console.log(`  Has email column: ${columns.includes('email') ? '✅ YES' : '❌ NO'}`);
}

checkProfilesSchema();
