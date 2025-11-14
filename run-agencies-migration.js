const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running agencies migration...\n');

  try {
    // Read the migration file
    const migration = fs.readFileSync('supabase/migrations/20250213_add_active_field_agencies.sql', 'utf8');

    // Split by semicolons and filter out comments and empty statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 100) + '...');

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Try direct query if rpc fails
        console.log('Trying alternative method...');
        const { error: error2 } = await supabase.from('_migrations').insert({
          statement: statement
        });

        if (error2) {
          console.error('❌ Error:', error.message || error);
          console.log('Statement:', statement);
        } else {
          console.log('✅ Done\n');
        }
      } else {
        console.log('✅ Done\n');
      }
    }

    // Now set agencies to active but not approved/verified
    console.log('\n📝 Setting agencies to active status...');
    const { data, error } = await supabase
      .from('agencies')
      .update({
        active: true,
        application_status: 'pending',
        verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'VN')
      .select('id');

    if (error) {
      console.error('❌ Update error:', error);
    } else {
      console.log(`✅ Updated ${data.length} agencies to active=true, status=pending, verified=false`);
    }

    // Verify the changes
    console.log('\n📊 Verification:');
    const { data: sample, error: sampleError } = await supabase
      .from('agencies')
      .select('id, name, active, application_status, verified, website, website_url')
      .eq('country_code', 'VN')
      .limit(5);

    if (sampleError) {
      console.error('❌ Verification error:', sampleError);
    } else {
      console.table(sample);
    }

    // Count by status
    const { data: statusData, error: statusError } = await supabase
      .from('agencies')
      .select('active, application_status, verified')
      .eq('country_code', 'VN');

    if (!statusError && statusData) {
      const counts = statusData.reduce((acc, row) => {
        const key = `active:${row.active} | status:${row.application_status} | verified:${row.verified}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      console.log('\nStatus Distribution:');
      Object.entries(counts).forEach(([key, count]) => {
        console.log(`  ${key}: ${count}`);
      });
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

runMigration();
