const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAgenciesToPending() {
  console.log('🔄 Setting agencies to pending status...\n');

  try {
    // Update all Vietnamese agencies to pending
    const { data, error } = await supabase
      .from('agencies')
      .update({
        application_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'VN')
      .eq('application_status', 'approved')
      .select('id');

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    console.log(`✅ Updated ${data.length} agencies from 'approved' to 'pending'\n`);

    // Also copy website_url to website if needed
    console.log('📝 Normalizing website fields...');

    const { data: agenciesWithWebsite, error: fetchError } = await supabase
      .from('agencies')
      .select('id, website, website_url')
      .neq('website_url', null)
      .eq('country_code', 'VN');

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
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

    // Verify the changes
    console.log('📊 Current status distribution:');
    const { data: statusData } = await supabase
      .from('agencies')
      .select('active, application_status, verified')
      .eq('country_code', 'VN');

    if (statusData) {
      const counts = statusData.reduce((acc, row) => {
        const key = `active:${row.active} | status:${row.application_status} | verified:${row.verified}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      Object.entries(counts).forEach(([key, count]) => {
        console.log(`  ${key}: ${count}`);
      });
    }

    // Sample
    console.log('\n📋 Sample of updated agencies:');
    const { data: sample } = await supabase
      .from('agencies')
      .select('id, name, active, application_status, verified, website, website_url')
      .eq('country_code', 'VN')
      .limit(5);

    console.table(sample);

    console.log('\n✅ All done! Agencies are now:');
    console.log('   - active: true (visible in directory)');
    console.log('   - application_status: pending (not approved)');
    console.log('   - verified: varies (depends on if claimed)');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

setAgenciesToPending();
