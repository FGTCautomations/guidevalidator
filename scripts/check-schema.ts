import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    console.log('=== PROFILES TABLE COLUMNS ===');
    const profilesCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    `);
    profilesCols.rows.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n=== AGENCIES TABLE COLUMNS ===');
    const agenciesCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agencies'
      ORDER BY ordinal_position
    `);
    agenciesCols.rows.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
