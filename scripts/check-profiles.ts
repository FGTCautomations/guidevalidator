import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  console.log('Checking profiles across all tables...\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check profiles table (guides)
    console.log('=== PROFILES TABLE (Guides) ===');
    const profilesResult = await client.query(`
      SELECT id, full_name, role, verified, created_at
      FROM profiles
      WHERE role = 'guide'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Total guides in profiles: ${profilesResult.rows.length}`);
    profilesResult.rows.forEach(row => {
      console.log(`  - ${row.full_name || 'No name'} (${row.id}) | Role: ${row.role} | Verified: ${row.verified}`);
    });

    // Check profiles table for other roles
    console.log('\n=== PROFILES TABLE (Non-Guides) ===');
    const otherProfilesResult = await client.query(`
      SELECT id, full_name, role, verified, created_at
      FROM profiles
      WHERE role != 'guide'
      ORDER BY role, created_at DESC
    `);
    console.log(`Total non-guide profiles: ${otherProfilesResult.rows.length}`);
    otherProfilesResult.rows.forEach(row => {
      console.log(`  - ${row.full_name || 'No name'} (${row.id}) | Role: ${row.role} | Verified: ${row.verified}`);
    });

    // Check agencies table
    console.log('\n=== AGENCIES TABLE ===');
    const agenciesResult = await client.query(`
      SELECT id, name, type, verified, created_at
      FROM agencies
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Total agencies: ${agenciesResult.rows.length}`);
    agenciesResult.rows.forEach(row => {
      console.log(`  - ${row.name || 'No name'} (${row.id}) | Type: ${row.type} | Verified: ${row.verified}`);
    });

    // Check what types exist in agencies table
    console.log('\n=== AGENCY TYPES BREAKDOWN ===');
    const agencyTypesResult = await client.query(`
      SELECT type, COUNT(*) as count
      FROM agencies
      GROUP BY type
      ORDER BY count DESC
    `);
    agencyTypesResult.rows.forEach(row => {
      console.log(`  ${row.type}: ${row.count}`);
    });

    // Check directory view for guides
    console.log('\n=== DIRECTORY VIEW - GUIDES ===');
    const guideDirResult = await client.query(`
      SELECT id, full_name, role, verified
      FROM profiles
      WHERE role = 'guide' AND verified = true
      LIMIT 5
    `);
    console.log(`Verified guides visible in directory: ${guideDirResult.rows.length}`);
    guideDirResult.rows.forEach(row => {
      console.log(`  - ${row.full_name || 'No name'} (${row.id})`);
    });

    // Check directory view for agencies
    console.log('\n=== DIRECTORY VIEW - AGENCIES (agency type) ===');
    const agencyDirResult = await client.query(`
      SELECT id, name, type, verified
      FROM agencies
      WHERE type = 'agency' AND verified = true
      LIMIT 5
    `);
    console.log(`Verified agencies visible in directory: ${agencyDirResult.rows.length}`);
    agencyDirResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.id})`);
    });

    // Check directory view for DMCs
    console.log('\n=== DIRECTORY VIEW - DMCs (dmc type) ===');
    const dmcDirResult = await client.query(`
      SELECT id, name, type, verified
      FROM agencies
      WHERE type = 'dmc' AND verified = true
      LIMIT 5
    `);
    console.log(`Verified DMCs visible in directory: ${dmcDirResult.rows.length}`);
    dmcDirResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.id})`);
    });

    // Check directory view for Transport
    console.log('\n=== DIRECTORY VIEW - TRANSPORT (transport type) ===');
    const transportDirResult = await client.query(`
      SELECT id, name, type, verified
      FROM agencies
      WHERE type = 'transport' AND verified = true
      LIMIT 5
    `);
    console.log(`Verified transport visible in directory: ${transportDirResult.rows.length}`);
    transportDirResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.id})`);
    });

    // Summary
    console.log('\n=== SUMMARY ===');
    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM profiles WHERE role = 'guide') as total_guides,
        (SELECT COUNT(*) FROM profiles WHERE role = 'guide' AND verified = true) as verified_guides,
        (SELECT COUNT(*) FROM agencies WHERE type = 'agency') as total_agencies,
        (SELECT COUNT(*) FROM agencies WHERE type = 'agency' AND verified = true) as verified_agencies,
        (SELECT COUNT(*) FROM agencies WHERE type = 'dmc') as total_dmcs,
        (SELECT COUNT(*) FROM agencies WHERE type = 'dmc' AND verified = true) as verified_dmcs,
        (SELECT COUNT(*) FROM agencies WHERE type = 'transport') as total_transport,
        (SELECT COUNT(*) FROM agencies WHERE type = 'transport' AND verified = true) as verified_transport
    `);
    const stats = summary.rows[0];
    console.log(`Guides: ${stats.verified_guides}/${stats.total_guides} verified`);
    console.log(`Agencies: ${stats.verified_agencies}/${stats.total_agencies} verified`);
    console.log(`DMCs: ${stats.verified_dmcs}/${stats.total_dmcs} verified`);
    console.log(`Transport: ${stats.verified_transport}/${stats.total_transport} verified`);

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
