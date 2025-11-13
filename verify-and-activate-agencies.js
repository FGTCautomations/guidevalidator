const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAndActivate() {
  console.log('🔍 Checking current state...\n');

  try {
    // Check if active column exists
    const { data: testData, error: testError } = await supabase
      .from('agencies')
      .select('active')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      console.log('⚠️  Active column does not exist. Creating it now...\n');

      // Can't alter table via JS, need SQL
      console.log('❌ ERROR: You must run the SQL migration first!');
      console.log('\n📝 Run this in Supabase SQL Editor:');
      console.log('   supabase/migrations/20250214_add_active_and_update_views.sql');
      console.log('\n   OR run these commands:');
      console.log('   ALTER TABLE agencies ADD COLUMN active BOOLEAN DEFAULT false;');
      console.log('   CREATE INDEX idx_agencies_active ON agencies(active);');
      process.exit(1);
    }

    console.log('✅ Active column exists\n');

    // Step 1: Set all agencies to the correct state
    console.log('📝 Setting all agencies to: active=true, status=pending, verified=false\n');

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
      throw updateError;
    }

    console.log(`✅ Updated ${updateData.length} agencies\n`);

    // Step 2: Verify the state
    console.log('📊 Current state of Vietnamese agencies:\n');

    const { data: agencies, error: fetchError } = await supabase
      .from('agencies')
      .select('active, application_status, verified, type')
      .eq('country_code', 'VN');

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }

    // Group by state
    const summary = agencies.reduce((acc, agency) => {
      const key = `${agency.type} | active:${agency.active} | status:${agency.application_status} | verified:${agency.verified}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    console.log('State breakdown:');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });

    // Step 3: Check materialized view
    console.log('\n📊 Checking materialized view...\n');

    const { data: viewData, error: viewError } = await supabase
      .from('agencies_browse_v')
      .select('id')
      .eq('country_code', 'VN');

    if (viewError) {
      console.error('⚠️  Materialized view error:', viewError.message);
      console.log('\n❌ The materialized view needs to be recreated!');
      console.log('   Run the SQL migration: supabase/migrations/20250214_add_active_and_update_views.sql');
    } else {
      console.log(`✅ Materialized view has ${viewData.length} Vietnamese agencies`);
    }

    // Step 4: Sample
    console.log('\n📋 Sample of 5 agencies:\n');
    const { data: sample } = await supabase
      .from('agencies')
      .select('id, name, type, active, application_status, verified')
      .eq('country_code', 'VN')
      .limit(5);

    console.table(sample);

    console.log('\n✅ ALL DONE!');
    console.log('\n📝 System State:');
    console.log('   - active: true = Shows in directory');
    console.log('   - application_status: pending = Awaiting admin approval (limited info shown)');
    console.log('   - verified: false = Profile not claimed by owner');
    console.log('\n🌐 Test directory: http://localhost:3000/directory/agencies?country=VN');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

verifyAndActivate();
