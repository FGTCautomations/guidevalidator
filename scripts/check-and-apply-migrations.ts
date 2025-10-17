import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkTableExists(client: Client, tableName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function checkFunctionExists(client: Client, functionName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM pg_proc
      WHERE proname = $1
    )`,
    [functionName]
  );
  return result.rows[0].exists;
}

async function main() {
  console.log('Starting migration check...\n');
  console.log('Connecting to database...');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check reviews table
    const reviewsExists = await checkTableExists(client, 'reviews');
    console.log(`reviews table: ${reviewsExists ? '✓ EXISTS' : '✗ MISSING'}`);

    // Check review_responses table
    const responsesExists = await checkTableExists(client, 'review_responses');
    console.log(`review_responses table: ${responsesExists ? '✓ EXISTS' : '✗ MISSING'}`);

    // Check profile_ratings view
    const ratingsExists = await checkTableExists(client, 'profile_ratings');
    console.log(`profile_ratings view: ${ratingsExists ? '✓ EXISTS' : '✗ MISSING'}`);

    // Check get_average_rating function
    const funcExists = await checkFunctionExists(client, 'get_average_rating');
    console.log(`get_average_rating function: ${funcExists ? '✓ EXISTS' : '✗ MISSING'}`);

    console.log('\n--- Migration Status ---');

    if (!reviewsExists) {
      console.log('\n⚠ Need to apply: 20251005100000_reviews_system.sql');
      console.log('  This migration creates the reviews table, but it may have been partially applied.');
      console.log('  You may need to manually fix conflicting objects.');
    } else {
      console.log('✓ Reviews system is already set up');
    }

    if (!responsesExists) {
      console.log('\n⚠ Need to apply: 20251005110000_review_responses.sql');
      console.log('  Applying now...');
      const sql = fs.readFileSync('supabase/migrations/20251005110000_review_responses.sql', 'utf-8');
      try {
        await client.query(sql);
        console.log('  ✓ Successfully applied review_responses migration');
      } catch (err: any) {
        console.error(`  ✗ Error: ${err.message}`);
      }
    } else {
      console.log('✓ Review responses table already exists');
    }

    if (!funcExists) {
      console.log('\n⚠ Need to apply: 20251005120000_review_stats_functions.sql');
      console.log('  Applying now...');
      const sql = fs.readFileSync('supabase/migrations/20251005120000_review_stats_functions.sql', 'utf-8');
      try {
        await client.query(sql);
        console.log('  ✓ Successfully applied review_stats_functions migration');
      } catch (err: any) {
        console.error(`  ✗ Error: ${err.message}`);
      }
    } else {
      console.log('✓ Review stats function already exists');
    }

    console.log('\n✓ Migration check complete!');
    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
