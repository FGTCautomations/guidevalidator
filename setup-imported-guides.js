const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupImportedGuides() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  SETUP IMPORTED GUIDES FOR DIRECTORY           ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Get all imported guides (those without profile_id)
  console.log('Step 1: Fetching imported guides...');
  let guides = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('guides')
      .select('id, name, card_number, language, experience, province_issue, profile_id')
      .is('profile_id', null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    guides = guides.concat(data);
    console.log(`  Found ${guides.length} guides without profiles...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`✓ Total imported guides: ${guides.length}\n`);

  if (guides.length === 0) {
    console.log('No guides to setup. Checking existing profiles...\n');

    // Check guides with profiles
    const { count } = await supabase
      .from('guides')
      .select('*', { count: 'exact', head: true })
      .not('profile_id', 'is', null);

    console.log(`Guides with profiles: ${count || 0}\n`);
  }

  // Step 2: Process CSV column mapping
  console.log('Step 2: Mapping CSV columns to database columns...');
  let mappedCount = 0;

  for (const guide of guides) {
    const updates = {};

    // Map language (CSV) to spoken_languages (array)
    if (guide.language) {
      const langs = guide.language
        .toLowerCase()
        .replace(/"""/g, '')
        .replace(/"/g, '')
        .split(',')
        .map(lang => lang.trim())
        .filter(lang => lang);
      updates.spoken_languages = langs;
    }

    // Create headline from experience if available
    if (!guide.headline && guide.experience) {
      updates.headline = `Licensed Tour Guide - ${guide.experience}`;
    } else if (!guide.headline) {
      updates.headline = 'Licensed Tour Guide';
    }

    // Set default values
    updates.currency = updates.currency || 'USD';
    updates.has_liability_insurance = false;
    updates.specialties = ['cultural-tours', 'historical-sites'];

    // Update guide
    const { error: updateError } = await supabase
      .from('guides')
      .update(updates)
      .eq('id', guide.id);

    if (!updateError) {
      mappedCount++;
      if (mappedCount % 100 === 0) {
        console.log(`  Mapped ${mappedCount} guides...`);
      }
    }
  }

  console.log(`✓ Mapped ${mappedCount} guides\n`);

  // Step 3: Create staging profiles
  console.log('Step 3: Creating staging profiles...');
  let profilesCreated = 0;

  for (const guide of guides) {
    try {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: guide.name,
          country_code: 'VN',
          role: 'guide',
          application_status: 'pending',
          verified: false,
          license_verified: false,
        })
        .select()
        .single();

      if (profileError) {
        console.error(`  ✗ Error creating profile for ${guide.name}:`, profileError.message);
        continue;
      }

      // Update guide with profile_id
      const { error: linkError } = await supabase
        .from('guides')
        .update({ profile_id: profile.id })
        .eq('id', guide.id);

      if (!linkError) {
        profilesCreated++;
        if (profilesCreated % 100 === 0) {
          console.log(`  Created ${profilesCreated} profiles...`);
        }
      }

    } catch (error) {
      console.error(`  ✗ Exception for ${guide.name}:`, error.message);
    }
  }

  console.log(`✓ Created ${profilesCreated} staging profiles\n`);

  // Step 4: Generate claim tokens
  console.log('Step 4: Generating profile claim tokens...');

  // Get all guides with card_number and profile_id
  const { data: guidesWithProfiles } = await supabase
    .from('guides')
    .select('id, profile_id, card_number')
    .not('profile_id', 'is', null)
    .not('card_number', 'is', null);

  console.log(`  Found ${guidesWithProfiles?.length || 0} guides eligible for tokens...`);

  let tokensCreated = 0;
  let tokenErrors = 0;

  for (const guide of guidesWithProfiles || []) {
    try {
      const token = crypto.randomBytes(32).toString('base64');
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const { error: tokenError } = await supabase
        .from('profile_claim_tokens')
        .insert({
          profile_id: guide.profile_id,
          license_number: guide.card_number,
          token: token,
          expires_at: expiryDate.toISOString(),
        });

      if (tokenError) {
        // Check if it's a duplicate
        if (tokenError.code === '23505') {
          // Already exists, skip
          continue;
        }
        console.error(`  ✗ Error creating token for ${guide.card_number}:`, tokenError.message);
        tokenErrors++;
      } else {
        tokensCreated++;
        if (tokensCreated % 100 === 0) {
          console.log(`  Created ${tokensCreated} tokens...`);
        }
      }

    } catch (error) {
      console.error(`  ✗ Exception:`, error.message);
      tokenErrors++;
    }
  }

  console.log(`✓ Created ${tokensCreated} claim tokens (${tokenErrors} errors)\n`);

  // Step 5: Refresh materialized view
  console.log('Step 5: Refreshing directory view...');
  const { error: refreshError } = await supabase.rpc('refresh_materialized_view', {
    view_name: 'guides_browse_v'
  });

  if (refreshError) {
    console.log('  Note: Could not refresh view automatically. Run this SQL in Supabase:');
    console.log('  REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;\n');
  } else {
    console.log('✓ Directory view refreshed\n');
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              SETUP SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Imported guides found:        ${guides.length}`);
  console.log(`CSV columns mapped:           ${mappedCount}`);
  console.log(`Staging profiles created:     ${profilesCreated}`);
  console.log(`Claim tokens generated:       ${tokensCreated}`);
  console.log(`Token errors:                 ${tokenErrors}`);
  console.log('════════════════════════════════════════════════\n');

  // Final verification
  console.log('Verification:');

  const { count: totalGuides } = await supabase
    .from('guides')
    .select('*', { count: 'exact', head: true });

  const { count: guidesWithProfiles2 } = await supabase
    .from('guides')
    .select('*', { count: 'exact', head: true })
    .not('profile_id', 'is', null);

  const { count: totalTokens } = await supabase
    .from('profile_claim_tokens')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total guides in database:     ${totalGuides || 0}`);
  console.log(`  Guides with profiles:         ${guidesWithProfiles2 || 0}`);
  console.log(`  Total claim tokens:           ${totalTokens || 0}`);
  console.log('');
}

setupImportedGuides()
  .then(() => {
    console.log('✓ Process completed!');
    console.log('\nNext steps:');
    console.log('1. Run in Supabase SQL Editor: REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;');
    console.log('2. Check directory at /directory/guides?country=VN');
    console.log('3. Guides can claim profiles using their license numbers\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
