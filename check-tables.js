// Check which tables exist in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking for tables related to parks...\n');

  // Try different possible table names
  const possibleNames = [
    'national_parks',
    'national_parks_stage',
    'parks',
    'tourist_attractions'
  ];

  for (const tableName of possibleNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Table "${tableName}" - ERROR: ${error.message}`);
      } else {
        console.log(`✅ Table "${tableName}" - EXISTS (found ${data?.length || 0} rows in test query)`);
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}" - EXCEPTION: ${err.message}`);
    }
  }

  console.log('\n📋 Checking schema information...\n');

  // Query information_schema to see all tables
  const { data: tables, error: schemaError } = await supabase
    .rpc('exec_sql', {
      sql: `SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE '%park%'
            ORDER BY table_name;`
    });

  if (schemaError) {
    console.log('Note: Cannot query information_schema directly');
    console.log('Try running this SQL in Supabase SQL Editor:');
    console.log(`
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%park%' OR table_name LIKE '%attraction%')
ORDER BY table_name;
    `);
  } else {
    console.log('Tables with "park" in name:', tables);
  }
}

main().catch(console.error);
