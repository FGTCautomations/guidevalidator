const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateAgencies() {
  console.log('🔄 Activating agencies for directory...\n');

  try {
    // Step 1: Update agencies to approved and verified
    console.log('Step 1: Setting agencies to approved and verified...');
    const { data: updateData, error: updateError } = await supabase
      .from('agencies')
      .update({
        application_status: 'approved',
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'VN')
      .select('id');

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Updated ${updateData?.length || 0} agencies\n`);

    // Step 2: Check the status distribution
    console.log('Step 2: Checking status distribution...');
    const { data: statusData, error: statusError } = await supabase
      .from('agencies')
      .select('application_status, verified')
      .eq('country_code', 'VN');

    if (statusError) {
      console.error('❌ Status check error:', statusError);
    } else {
      const statusCounts = statusData.reduce((acc, row) => {
        const key = `${row.application_status} | verified: ${row.verified}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      console.log('Status Distribution:');
      Object.entries(statusCounts).forEach(([key, count]) => {
        console.log(`  ${key}: ${count}`);
      });
      console.log();
    }

    // Step 3: Sample agencies
    console.log('Step 3: Sample of activated agencies:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('agencies')
      .select('id, name, type, application_status, verified, website_url, contact_email')
      .eq('country_code', 'VN')
      .limit(10);

    if (sampleError) {
      console.error('❌ Sample query error:', sampleError);
    } else {
      console.table(sampleData);
    }

    console.log('\n✅ Agencies activation complete!');
    console.log('Next: Check directory at /directory/agencies?country=VN');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

activateAgencies();
