import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    console.log('=== ANALYZING CURRENT DATABASE STRUCTURE ===\n');

    // Check profiles table structure
    console.log('1. PROFILES TABLE - What roles exist?');
    const profileRoles = await client.query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('Roles in profiles table:');
    profileRoles.rows.forEach((row: any) => {
      console.log(`  ${row.role}: ${row.count}`);
    });

    // Check if profiles has company data fields
    console.log('\n2. PROFILES TABLE - Does it have company fields?');
    const profileCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name IN ('name', 'company_name', 'organization_name', 'business_name')
      ORDER BY column_name
    `);
    if (profileCols.rows.length > 0) {
      console.log('Company-related columns found:');
      profileCols.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}`);
      });
    } else {
      console.log('❌ No company name fields in profiles table');
      console.log('   Profiles only has: full_name (for individuals)');
    }

    // Check agencies table structure
    console.log('\n3. AGENCIES TABLE - What does it contain?');
    const agencyCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'agencies'
      ORDER BY ordinal_position
    `);
    console.log('Columns in agencies table:');
    agencyCols.rows.slice(0, 15).forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Check if there's a profile_id link
    const hasProfileId = agencyCols.rows.some((r: any) => r.column_name === 'profile_id');
    if (hasProfileId) {
      console.log('\n4. AGENCIES ↔ PROFILES RELATIONSHIP');
      const linkedAgencies = await client.query(`
        SELECT
          a.id as agency_id,
          a.name as agency_name,
          a.type,
          a.profile_id,
          p.full_name as owner_name,
          p.role as owner_role
        FROM agencies a
        LEFT JOIN profiles p ON a.profile_id = p.id
      `);

      console.log(`Total agencies: ${linkedAgencies.rows.length}`);
      linkedAgencies.rows.forEach((row: any) => {
        if (row.profile_id) {
          console.log(`  ${row.agency_name} (${row.type})`);
          console.log(`    → Linked to profile: ${row.owner_name} (role: ${row.owner_role})`);
        } else {
          console.log(`  ${row.agency_name} (${row.type}) → ⚠️  NO PROFILE LINK`);
        }
      });
    }

    // Check guides table
    console.log('\n5. GUIDES TABLE - Is there a separate guides table?');
    const guidesTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'guides'
      ) as exists
    `);

    if (guidesTable.rows[0].exists) {
      console.log('✓ Yes, separate guides table exists');

      const guidesData = await client.query(`
        SELECT
          g.profile_id,
          p.full_name,
          p.role,
          p.verified
        FROM guides g
        JOIN profiles p ON g.profile_id = p.id
        LIMIT 5
      `);

      console.log(`Guides in guides table: ${guidesData.rows.length}`);
      guidesData.rows.forEach((row: any) => {
        console.log(`  ${row.full_name} (profile role: ${row.role}, verified: ${row.verified})`);
      });
    }

    // The problem
    console.log('\n\n=== THE PROBLEM ===');
    console.log(`
Current structure has 3 places for user data:

1. PROFILES table - Auth users + guides
   - Used for: Authentication, guides
   - Has role: 'guide', 'visitor', 'admin', etc.
   - Has full_name (individuals only)

2. GUIDES table - Guide-specific data
   - Links to profiles via profile_id
   - Has guide-specific fields (rates, languages, etc.)

3. AGENCIES table - Companies (agencies, DMCs, transport)
   - Separate table for companies
   - Has name, type, etc.
   - May have profile_id link (for owner)

ISSUES:
❌ Inconsistent: Guides use profiles+guides, but agencies/DMCs/transport use agencies
❌ Confusing: Need to query different tables for different user types
❌ Directory code must handle 2 different table structures
❌ Review system must handle both profiles and agencies as reviewees
    `);

    // The solution
    console.log('=== RECOMMENDED SOLUTION ===');
    console.log(`
Option A: Keep separate tables but improve consistency
  - Keep profiles for individual users (guides)
  - Keep agencies for companies (agency, dmc, transport)
  - But ensure ALL users (individuals + companies) have a profile entry
  - Link agencies.profile_id → profiles.id for ownership

  Pros: ✓ Matches business model (individuals vs companies)
        ✓ Less data migration needed
  Cons: ✗ Still requires dual table queries in directory

Option B: Merge everything into profiles table
  - Add 'name' column for company names
  - Add 'entity_type' (individual vs company)
  - Move all agencies data into profiles
  - Use role field for: guide, agency, dmc, transport

  Pros: ✓ Single table for all directory queries
        ✓ Simpler code
        ✓ Consistent structure
  Cons: ✗ Large migration needed
        ✗ Loses semantic distinction between people and companies

RECOMMENDATION: Keep current structure but fix the issues
    `);

    // What's actually broken
    console.log('\n=== WHAT\'S ACTUALLY BROKEN? ===');

    // Check if agencies are appearing
    const agencyCount = await client.query(`
      SELECT type, COUNT(*) as count,
             COUNT(*) FILTER (WHERE verified = true) as verified_count
      FROM agencies
      GROUP BY type
    `);

    console.log('Agencies table contents:');
    agencyCount.rows.forEach((row: any) => {
      console.log(`  ${row.type}: ${row.count} total, ${row.verified_count} verified`);
    });

    // Check what the directory query would return
    console.log('\nWhat would directory query return for DMCs?');
    const dmcQuery = await client.query(`
      SELECT id, name, type, verified, country_code
      FROM agencies
      WHERE type = 'dmc'
      ORDER BY verified DESC, name ASC
      LIMIT 10
    `);

    if (dmcQuery.rows.length > 0) {
      console.log(`✓ Found ${dmcQuery.rows.length} DMCs:`);
      dmcQuery.rows.forEach((row: any) => {
        console.log(`  - ${row.name} (verified: ${row.verified}, country: ${row.country_code || 'N/A'})`);
      });
    } else {
      console.log('❌ Query returned 0 DMCs');
    }

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    console.error(err.stack);
    await client.end();
    process.exit(1);
  }
}

main();
