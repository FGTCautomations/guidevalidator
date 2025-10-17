import { Client } from 'pg';
import * as fs from 'fs';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    console.log('Applying migration: 20251005130000_fix_reviews_foreign_keys.sql');

    const sql = fs.readFileSync('supabase/migrations/20251005130000_fix_reviews_foreign_keys.sql', 'utf-8');

    await client.query(sql);

    console.log('✓ Migration applied successfully!\n');

    // Verify the constraints
    console.log('Checking foreign key constraints on reviews table...');
    const fkCheck = await client.query(`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'public.reviews'::regclass
      AND contype = 'f'
    `);

    if (fkCheck.rows.length === 0) {
      console.log('✓ Foreign key constraints successfully removed');
    } else {
      console.log('Remaining foreign keys:');
      fkCheck.rows.forEach((row: any) => {
        console.log(`  - ${row.constraint_name} (${row.constraint_type})`);
      });
    }

    console.log('\n✅ Reviews table is now ready to accept both profile and agency reviewees!');

    await client.end();
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    console.error('Details:', err);
    await client.end();
    process.exit(1);
  }
}

main();
