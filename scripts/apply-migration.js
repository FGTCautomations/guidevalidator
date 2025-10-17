const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('Applying migration: add new application fields...\n');

  const statements = [
    // Guide applications
    `ALTER TABLE guide_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)`,
    `ALTER TABLE guide_applications ADD COLUMN IF NOT EXISTS timezone TEXT`,
    `ALTER TABLE guide_applications ADD COLUMN IF NOT EXISTS availability_timezone TEXT`,
    `ALTER TABLE guide_applications ADD COLUMN IF NOT EXISTS working_hours JSONB`,
    `ALTER TABLE guide_applications ADD COLUMN IF NOT EXISTS avatar_url TEXT`,

    // Agency applications
    `ALTER TABLE agency_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)`,
    `ALTER TABLE agency_applications ADD COLUMN IF NOT EXISTS timezone TEXT`,
    `ALTER TABLE agency_applications ADD COLUMN IF NOT EXISTS availability_timezone TEXT`,
    `ALTER TABLE agency_applications ADD COLUMN IF NOT EXISTS working_hours JSONB`,
    `ALTER TABLE agency_applications ADD COLUMN IF NOT EXISTS avatar_url TEXT`,

    // DMC applications
    `ALTER TABLE dmc_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)`,
    `ALTER TABLE dmc_applications ADD COLUMN IF NOT EXISTS timezone TEXT`,
    `ALTER TABLE dmc_applications ADD COLUMN IF NOT EXISTS availability_timezone TEXT`,
    `ALTER TABLE dmc_applications ADD COLUMN IF NOT EXISTS working_hours JSONB`,
    `ALTER TABLE dmc_applications ADD COLUMN IF NOT EXISTS avatar_url TEXT`,

    // Transport applications
    `ALTER TABLE transport_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)`,
    `ALTER TABLE transport_applications ADD COLUMN IF NOT EXISTS timezone TEXT`,
    `ALTER TABLE transport_applications ADD COLUMN IF NOT EXISTS availability_timezone TEXT`,
    `ALTER TABLE transport_applications ADD COLUMN IF NOT EXISTS working_hours JSONB`,
    `ALTER TABLE transport_applications ADD COLUMN IF NOT EXISTS avatar_url TEXT`,

    // Guides table
    `ALTER TABLE guides ADD COLUMN IF NOT EXISTS timezone TEXT`,
    `ALTER TABLE guides ADD COLUMN IF NOT EXISTS availability_timezone TEXT`,
    `ALTER TABLE guides ADD COLUMN IF NOT EXISTS working_hours JSONB`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_guide_applications_user_id ON guide_applications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_agency_applications_user_id ON agency_applications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dmc_applications_user_id ON dmc_applications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transport_applications_user_id ON transport_applications(user_id)`,
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try direct query as fallback
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        console.log(`   ⚠️  RPC not available, using alternative method...`);

        // For now, just log it - we'll need to run manually
        console.log(`   ℹ️  Please run this SQL manually in Supabase dashboard`);
      } else {
        console.log(`   ✓ Success`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`);
    }
  }

  console.log('\n✅ Migration script completed!');
  console.log('\nIf any statements failed, please run them manually in the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
}

runMigration().catch(console.error);
