import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check reviews table schema
    console.log('=== REVIEWS TABLE SCHEMA ===');
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'reviews'
      ORDER BY ordinal_position
    `);

    console.log(`Found ${schema.rows.length} columns:\n`);
    schema.rows.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
