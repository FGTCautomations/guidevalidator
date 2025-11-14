const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addActiveField() {
  console.log('🔄 Adding active field to agencies...\n');

  try {
    // Check if active field exists by trying to query it
    console.log('Step 1: Checking if active field exists...');
    const { error: checkError } = await supabase
      .from('agencies')
      .select('active')
      .limit(1);

    if (checkError) {
      console.log('Active field does not exist. Need to add it via SQL.');
      console.log('⚠️  Please run the following SQL in Supabase SQL Editor:\n');
      console.log(`
ALTER TABLE agencies ADD COLUMN active BOOLEAN DEFAULT false;
CREATE INDEX idx_agencies_active ON agencies(active);
      `);
      console.log('\nAfter running the SQL, run this script again.\n');
      process.exit(1);
    }

    console.log('✅ Active field exists\n');

    // Step 2: Copy website_url to website
    console.log('Step 2: Copying website_url to website field...');

    const { data: agenciesWithWebsite, error: fetchError } = await supabase
      .from('agencies')
      .select('id, website, website_url')
      .neq('website_url', null)
      .eq('country_code', 'VN');

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
      console.log(`Found ${agenciesWithWebsite.length} agencies with website_url`);

      let updated = 0;
      for (const agency of agenciesWithWebsite) {
        if (!agency.website || agency.website === '') {
          const { error } = await supabase
            .from('agencies')
            .update({ website: agency.website_url })
            .eq('id', agency.id);

          if (!error) updated++;
        }
      }

      console.log(`✅ Updated ${updated} agencies with website data\n`);
    }

    // Step 3: Set agencies to active, pending, unverified
    console.log('Step 3: Setting agencies to active=true, status=pending, verified=false...');

    const { data: updateData, error: updateError } = await supabase
      .from('agencies')
      .update({
        active: true,
        application_status: 'pending',
        verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'VN')
      .select('id');

    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log(`✅ Updated ${updateData.length} agencies\n`);
    }

    // Step 4: Verify
    console.log('Step 4: Verification sample:');
    const { data: sample, error: sampleError } = await supabase
      .from('agencies')
      .select('id, name, active, application_status, verified, website, website_url')
      .eq('country_code', 'VN')
      .limit(5);

    if (sampleError) {
      console.error('❌ Sample error:', sampleError);
    } else {
      console.table(sample);
    }

    // Count totals
    const { count } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'VN')
      .eq('active', true);

    console.log(`\n📊 Total active agencies: ${count}`);

    console.log('\n✅ All done!');
    console.log('\nNext steps:');
    console.log('1. Update directory query to filter by active=true instead of verified=true');
    console.log('2. Test directory at /directory/agencies?country=VN');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

addActiveField();
