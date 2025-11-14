const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function matchLicensesFromClaimTokens() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  MATCH LICENSE KEYS FROM CLAIM TOKENS TABLE    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Check if profile_claim_tokens table exists and get its data
  console.log('Step 1: Fetching data from profile_claim_tokens table...');
  const { data: claimTokens, error: claimError } = await supabase
    .from('profile_claim_tokens')
    .select('*');

  if (claimError) {
    console.error('Error fetching claim tokens:', claimError);
    console.log('\nLet me check what tables exist...');

    // Try to list tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.log('Available columns in profiles table:');
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      console.log(profiles ? Object.keys(profiles[0] || {}) : 'No data');
    }

    return;
  }

  console.log(`✓ Found ${claimTokens?.length || 0} claim tokens\n`);

  if (!claimTokens || claimTokens.length === 0) {
    console.log('No claim tokens found in the table.');
    return;
  }

  // Show sample of claim tokens
  console.log('Sample claim token data:');
  console.log(JSON.stringify(claimTokens[0], null, 2));
  console.log('\n');

  // Step 2: Get all existing guides
  console.log('Step 2: Fetching existing guides...');
  const { data: guides, error: guidesError } = await supabase
    .from('guides')
    .select(`
      profile_id,
      license_number,
      profiles!inner(
        id,
        full_name
      )
    `);

  if (guidesError) {
    console.error('Error fetching guides:', guidesError);
    return;
  }

  console.log(`✓ Found ${guides.length} existing guides\n`);

  // Step 3: Match and update
  console.log('Step 3: Matching guides with claim tokens...');
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const guide of guides) {
    const profile = guide.profiles;

    // Find matching claim token (you'll need to tell me what field to match on)
    // For now, I'll try to match by profile_id or name
    const matchingToken = claimTokens.find(token =>
      token.profile_id === guide.profile_id ||
      token.name === profile.full_name
    );

    if (!matchingToken) {
      skipped++;
      continue;
    }

    // Skip if already has license number
    if (guide.license_number) {
      console.log(`  ℹ Skipping ${profile.full_name} - already has license ${guide.license_number}`);
      continue;
    }

    try {
      // Update guide with license from claim token
      const { error: updateError } = await supabase
        .from('guides')
        .update({
          license_number: matchingToken.license_number || matchingToken.card_number,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', guide.profile_id);

      if (updateError) {
        console.error(`  ✗ Error updating ${profile.full_name}:`, updateError.message);
        errors++;
        continue;
      }

      updated++;
      console.log(`  ✓ Updated ${profile.full_name} with license ${matchingToken.license_number || matchingToken.card_number}`);

    } catch (error) {
      console.error(`  ✗ Error processing ${profile.full_name}:`, error.message);
      errors++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              UPDATE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total guides:                 ${guides.length}`);
  console.log(`Claim tokens available:       ${claimTokens.length}`);
  console.log(`Successfully updated:         ${updated}`);
  console.log(`No match found:               ${skipped}`);
  console.log(`Errors:                       ${errors}`);
  console.log('════════════════════════════════════════════════\n');
}

matchLicensesFromClaimTokens()
  .then(() => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
