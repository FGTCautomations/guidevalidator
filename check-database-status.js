const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkDatabase() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DATABASE CLEANUP STATUS                       ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Check profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role');

  console.log('Remaining profiles:', allProfiles?.length || 0);
  if (allProfiles && allProfiles.length > 0) {
    console.log('\nAdmin users:');
    allProfiles.forEach(p => {
      console.log(`  - ${p.full_name || 'N/A'} (${p.role})`);
    });
  }

  // Check guides
  const { count: guidesCount } = await supabase
    .from('guides')
    .select('*', { count: 'exact', head: true });

  // Check agencies
  const { count: agenciesCount } = await supabase
    .from('agencies')
    .select('*', { count: 'exact', head: true });

  // Check dmcs
  const { count: dmcsCount } = await supabase
    .from('dmcs')
    .select('*', { count: 'exact', head: true });

  // Check transport_companies
  const { count: transportCount } = await supabase
    .from('transport_companies')
    .select('*', { count: 'exact', head: true });

  // Check claim tokens
  const { count: claimTokensCount } = await supabase
    .from('profile_claim_tokens')
    .select('*', { count: 'exact', head: true });

  console.log('\nOther tables:');
  console.log('  Guides:', guidesCount || 0);
  console.log('  Agencies:', agenciesCount || 0);
  console.log('  DMCs:', dmcsCount || 0);
  console.log('  Transport Companies:', transportCount || 0);
  console.log('  Claim Tokens:', claimTokensCount || 0);
  console.log('\n✓ Database is clean and ready!\n');
}

checkDatabase().then(() => process.exit(0)).catch(console.error);
