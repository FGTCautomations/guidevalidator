import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check agencies table schema
    console.log('=== AGENCIES TABLE SCHEMA ===');
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'agencies'
      ORDER BY ordinal_position
    `);

    console.log(`Found ${schema.rows.length} columns:\n`);
    schema.rows.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });

    // Sample data from one agency
    console.log('\n=== SAMPLE AGENCY DATA ===');
    const sample = await client.query(`
      SELECT *
      FROM agencies
      WHERE type = 'agency'
      LIMIT 1
    `);

    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }

    // Sample DMC
    console.log('\n=== SAMPLE DMC DATA ===');
    const sampleDMC = await client.query(`
      SELECT *
      FROM agencies
      WHERE type = 'dmc'
      LIMIT 1
    `);

    if (sampleDMC.rows.length > 0) {
      console.log(JSON.stringify(sampleDMC.rows[0], null, 2));
    }

    // Sample Transport
    console.log('\n=== SAMPLE TRANSPORT DATA ===');
    const sampleTransport = await client.query(`
      SELECT *
      FROM agencies
      WHERE type = 'transport'
      LIMIT 1
    `);

    if (sampleTransport.rows.length > 0) {
      console.log(JSON.stringify(sampleTransport.rows[0], null, 2));
    }

    // Check if there's a profiles link
    console.log('\n=== CHECK PROFILE LINKAGE ===');
    const withProfile = await client.query(`
      SELECT
        a.id,
        a.name,
        a.type,
        p.full_name as profile_name,
        p.country_code as profile_country,
        p.application_status
      FROM agencies a
      LEFT JOIN profiles p ON p.id = a.id OR p.id = a.profile_id
      WHERE a.type = 'agency'
      LIMIT 3
    `);

    console.log(`Agencies with profile data:`);
    withProfile.rows.forEach((row: any, idx: number) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.type}) -> Profile: ${row.profile_name || 'NOT FOUND'} | Country: ${row.profile_country || 'N/A'}`);
    });

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
