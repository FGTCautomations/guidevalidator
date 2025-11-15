// Check auth users email patterns
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthUsers() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Auth Users Email Patterns                   ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('Fetching all auth users...\n');

  // Fetch all users
  let allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      console.error('❌ Error fetching users:', error);
      break;
    }

    if (!data.users || data.users.length === 0) break;

    allUsers = allUsers.concat(data.users);
    console.log(`  Fetched ${allUsers.length} users so far...`);

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`\n✅ Total auth users: ${allUsers.length}\n`);

  // Analyze email patterns
  const emailPatterns = {};
  let noEmail = 0;

  allUsers.forEach(user => {
    if (!user.email) {
      noEmail++;
    } else {
      const domain = user.email.split('@')[1] || 'unknown';
      emailPatterns[domain] = (emailPatterns[domain] || 0) + 1;
    }
  });

  console.log('Email Domain Distribution:\n');
  const sorted = Object.entries(emailPatterns).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 20).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`);
  });

  if (sorted.length > 20) {
    console.log(`  ... and ${sorted.length - 20} more domains\n`);
  }

  console.log(`\nUsers without email: ${noEmail}`);
  console.log(`Total domains: ${sorted.length}\n`);

  // Show sample of users without email
  const noEmailUsers = allUsers.filter(u => !u.email).slice(0, 5);
  if (noEmailUsers.length > 0) {
    console.log('Sample users without email:');
    noEmailUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ID: ${u.id}, Created: ${u.created_at}`);
    });
    console.log('');
  }

  // Check if there are profiles without corresponding auth users
  console.log('Checking for orphaned profiles...\n');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .limit(10);

  if (profiles) {
    console.log(`Sample profiles (${profiles.length}):`);
    for (const profile of profiles) {
      const authUser = allUsers.find(u => u.id === profile.id);
      console.log(`  ${profile.full_name || profile.id} (${profile.role}) - ${authUser ? 'Has auth' : 'NO AUTH'}`);
    }
  }
  console.log('');
}

checkAuthUsers().catch(console.error);
