// Apply name_english migration to production database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Applying name_english Migration                  ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_add_name_english_to_views.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...\n');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the changes
    console.log('Verifying changes...\n');

    // Check agencies_browse_v
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies_browse_v')
      .select('id, name, name_english, country_code')
      .eq('country_code', 'VN')
      .limit(5);

    if (agenciesError) {
      console.error('❌ Verification query failed:', agenciesError.message);
    } else {
      console.log(`Found ${agencies.length} sample agencies:`);
      agencies.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.name_english || a.name} (${a.name})`);
      });
      console.log('');
    }

    // Test API function
    console.log('Testing api_agencies_search function...\n');
    const { data: apiResult, error: apiError } = await supabase.rpc('api_agencies_search', {
      p_country: 'VN',
      p_limit: 5
    });

    if (apiError) {
      console.error('❌ API test failed:', apiError.message);
    } else {
      const results = apiResult.results || [];
      console.log(`API returned ${results.length} results:`);
      results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name_english || r.name}`);
      });
      console.log('');
      console.log(`Total agencies in facets: ${apiResult.facets?.total || 0}`);
    }

    console.log('\n✅ All done!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration().catch(console.error);
