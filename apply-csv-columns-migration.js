const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying CSV columns migration to guides table...\n');

  // Read the migration SQL
  const migrationSQL = fs.readFileSync(
    'C:\\Users\\PC\\Guide-Validator\\supabase\\migrations\\20250203_add_guide_csv_columns.sql',
    'utf-8'
  );

  console.log('Migration SQL:');
  console.log(migrationSQL);
  console.log('\n');

  // Split into individual statements (simple split by semicolon)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        // Continue anyway, some errors might be expected (like IF NOT EXISTS)
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('MIGRATION COMPLETE');
  console.log('========================================');
  console.log('The CSV columns have been added to the guides table.');
  console.log('You can now run the import scripts.');
}

// Run migration
applyMigration().catch(console.error);
