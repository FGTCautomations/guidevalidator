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

async function fetchAllClaimTokens() {
  console.log('Fetching ALL claim tokens (paginated)...');
  let allTokens = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('profile_claim_tokens')
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching claim tokens:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allTokens = allTokens.concat(data);
    console.log(`  Fetched ${allTokens.length} claim tokens so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allTokens;
}

async function fetchAllGuides() {
  console.log('Fetching ALL guides (paginated)...');
  let allGuides = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('guides')
      .select(`
        profile_id,
        license_number,
        profiles!inner(
          id,
          full_name
        )
      `)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching guides:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allGuides = allGuides.concat(data);
    console.log(`  Fetched ${allGuides.length} guides so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allGuides;
}

async function matchLicensesFromClaimTokens() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  MATCH LICENSE KEYS FROM CLAIM TOKENS TABLE    ║');
  console.log('║           (ALL RECORDS - NO LIMIT)             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Fetch all claim tokens
  console.log('Step 1: Fetching ALL claim tokens...');
  const claimTokens = await fetchAllClaimTokens();
  console.log(`✓ Found ${claimTokens.length} total claim tokens\n`);

  if (!claimTokens || claimTokens.length === 0) {
    console.log('No claim tokens found in the table.');
    return;
  }

  // Show sample of claim tokens
  console.log('Sample claim token data:');
  console.log(JSON.stringify(claimTokens[0], null, 2));
  console.log('\n');

  // Step 2: Get all existing guides
  console.log('Step 2: Fetching ALL guides...');
  const guides = await fetchAllGuides();
  console.log(`✓ Found ${guides.length} total guides\n`);

  // Step 3: Match and update
  console.log('Step 3: Matching guides with claim tokens...');
  let updated = 0;
  let skipped = 0;
  let alreadyHasLicense = 0;
  let errors = 0;

  for (const guide of guides) {
    const profile = guide.profiles;

    // Find matching claim token by profile_id
    const matchingToken = claimTokens.find(token =>
      token.profile_id === guide.profile_id
    );

    if (!matchingToken) {
      skipped++;
      continue;
    }

    // Skip if already has license number
    if (guide.license_number) {
      alreadyHasLicense++;
      if (alreadyHasLicense % 100 === 0) {
        console.log(`  ℹ Skipped ${alreadyHasLicense} guides that already have licenses...`);
      }
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
  console.log(`Already had licenses:         ${alreadyHasLicense}`);
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
