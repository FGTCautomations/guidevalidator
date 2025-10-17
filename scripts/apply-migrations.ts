import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filePath: string) {
  console.log(`Applying migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error(`Error applying ${path.basename(filePath)}:`, error);
      return false;
    }

    console.log(`✓ Successfully applied ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`Exception applying ${path.basename(filePath)}:`, err);
    return false;
  }
}

async function main() {
  const migrations = [
    'supabase/migrations/20251005100000_reviews_system.sql',
    'supabase/migrations/20251005110000_review_responses.sql',
    'supabase/migrations/20251005120000_review_stats_functions.sql',
  ];

  console.log('Starting migration process...\n');

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      console.log('\nMigration process stopped due to error.');
      process.exit(1);
    }
    console.log('');
  }

  console.log('All migrations applied successfully!');
}

main();
