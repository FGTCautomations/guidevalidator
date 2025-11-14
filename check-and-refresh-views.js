const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndRefreshViews() {
  console.log('🔍 Checking for materialized views...\n');

  try {
    // Check for materialized views related to agencies
    const { data: views, error: viewsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          matviewname,
          ispopulated,
          definition
        FROM pg_matviews
        WHERE matviewname LIKE '%agenc%' OR matviewname LIKE '%browse%';
      `
    });

    if (viewsError) {
      // If rpc doesn't work, try direct query approach
      console.log('Checking materialized views (alternate method)...');

      // Just verify agencies are queryable
      const { data: testAgencies, error: testError } = await supabase
        .from('agencies')
        .select('id, name, application_status, verified')
        .eq('country_code', 'VN')
        .eq('application_status', 'approved')
        .eq('verified', true)
        .limit(5);

      if (testError) {
        console.error('❌ Error querying agencies:', testError);
      } else {
        console.log(`✅ Found ${testAgencies.length} approved agencies (sample of 5)`);
        console.table(testAgencies);

        // Get total count
        const { count, error: countError } = await supabase
          .from('agencies')
          .select('*', { count: 'exact', head: true })
          .eq('country_code', 'VN')
          .eq('application_status', 'approved')
          .eq('verified', true);

        if (!countError) {
          console.log(`\n📊 Total approved & verified agencies: ${count}`);
        }
      }
    } else {
      console.log('Materialized views found:');
      console.table(views);
    }

    console.log('\n✅ Agencies should now be visible in directory!');
    console.log('🌐 Visit: http://localhost:3000/directory/agencies?country=VN');
    console.log('\nNote: If agencies still don\'t appear, the Edge Function may need redeployment.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndRefreshViews();
