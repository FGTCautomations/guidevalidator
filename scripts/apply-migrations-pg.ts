import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function applyMigration(client: Client, filePath: string) {
  console.log(`Applying migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    await client.query(sql);
    console.log(`✓ Successfully applied ${path.basename(filePath)}`);
    return true;
  } catch (err: any) {
    console.error(`Error applying ${path.basename(filePath)}:`, err.message);
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
  console.log('Connecting to database...');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    for (const migration of migrations) {
      const success = await applyMigration(client, migration);
      if (!success) {
        console.log('\nMigration process stopped due to error.');
        await client.end();
        process.exit(1);
      }
      console.log('');
    }

    console.log('All migrations applied successfully!');
    await client.end();
  } catch (err: any) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
}

main();
