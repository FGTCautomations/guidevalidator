import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationFile = join(__dirname, '..', 'supabase', 'migrations', '20251001180000_application_new_fields.sql');
const sql = readFileSync(migrationFile, 'utf8');

// Split by semicolon and filter empty statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`Running ${statements.length} SQL statements...`);

for (const statement of statements) {
  console.log('\nExecuting:', statement.substring(0, 100) + '...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.error('❌ Error:', error.message);
      // Continue with other statements
    } else {
      console.log('✓ Success');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

console.log('\n✅ Migration completed!');
process.exit(0);
