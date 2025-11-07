#!/usr/bin/env node

/**
 * Database Status Checker
 *
 * This script provides a comprehensive overview of the database consolidation status.
 * Run this anytime to check the current state of your database.
 *
 * Usage:
 *   node db-consolidation/check_database_status.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function checkTableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function getTableRowCount(client, tableName) {
  try {
    const result = await client.query(`SELECT COUNT(*) FROM ${tableName};`);
    return parseInt(result.rows[0].count, 10);
  } catch {
    return 0;
  }
}

async function getApplicationStats(client) {
  const stats = {
    guides: { pending: 0, approved: 0, rejected: 0 },
    agencies: { pending: 0, approved: 0, rejected: 0 },
    dmcs: { pending: 0, approved: 0, rejected: 0 },
    transport: { pending: 0, approved: 0, rejected: 0 },
  };

  try {
    // Guide stats (from profiles table)
    const guideResult = await client.query(`
      SELECT
        p.application_status,
        COUNT(*) as count
      FROM profiles p
      WHERE p.role = 'guide'
      GROUP BY p.application_status;
    `);

    guideResult.rows.forEach(row => {
      if (row.application_status in stats.guides) {
        stats.guides[row.application_status] = parseInt(row.count, 10);
      }
    });

    // Agency/DMC/Transport stats (from agencies table)
    const agencyResult = await client.query(`
      SELECT
        type,
        application_status,
        COUNT(*) as count
      FROM agencies
      GROUP BY type, application_status;
    `);

    agencyResult.rows.forEach(row => {
      const type = row.type === 'agency' ? 'agencies' : row.type + 's';
      if (type in stats && row.application_status in stats[type]) {
        stats[type][row.application_status] = parseInt(row.count, 10);
      }
    });

  } catch (error) {
    console.error('Error getting application stats:', error.message);
  }

  return stats;
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n=============================================');
    console.log('Database Consolidation Status');
    console.log('=============================================\n');

    // Check Phase 1-3 columns
    console.log('📊 Phase 1-3: Schema Changes\n');

    const phase1Checks = {
      'profiles.application_status': false,
      'profiles.application_submitted_at': false,
      'profiles.application_reviewed_at': false,
      'agencies.application_status': false,
      'agencies.application_data': false,
      'guides.application_data': false,
      'entity_locations': false,
    };

    // Check profiles columns
    const profilesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name IN ('application_status', 'application_submitted_at', 'application_reviewed_at');
    `);
    profilesColumns.rows.forEach(row => {
      phase1Checks[`profiles.${row.column_name}`] = true;
    });

    // Check agencies columns
    const agenciesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'agencies'
      AND column_name IN ('application_status', 'application_data');
    `);
    agenciesColumns.rows.forEach(row => {
      phase1Checks[`agencies.${row.column_name}`] = true;
    });

    // Check guides columns
    const guidesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'guides'
      AND column_name = 'application_data';
    `);
    if (guidesColumns.rows.length > 0) {
      phase1Checks['guides.application_data'] = true;
    }

    // Check entity_locations table
    phase1Checks['entity_locations'] = await checkTableExists(client, 'entity_locations');

    for (const [check, exists] of Object.entries(phase1Checks)) {
      console.log(`  ${exists ? '✅' : '❌'} ${check}`);
    }

    const phase1Complete = Object.values(phase1Checks).every(v => v);
    console.log(`\n  Phase 1-3 Status: ${phase1Complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}\n`);

    // Check application stats
    console.log('📈 Application Statistics\n');
    const stats = await getApplicationStats(client);

    console.log('  Guides:');
    console.log(`    Pending: ${stats.guides.pending}`);
    console.log(`    Approved: ${stats.guides.approved}`);
    console.log(`    Rejected: ${stats.guides.rejected}`);

    console.log('\n  Agencies:');
    console.log(`    Pending: ${stats.agencies.pending}`);
    console.log(`    Approved: ${stats.agencies.approved}`);
    console.log(`    Rejected: ${stats.agencies.rejected}`);

    console.log('\n  DMCs:');
    console.log(`    Pending: ${stats.dmcs.pending}`);
    console.log(`    Approved: ${stats.dmcs.approved}`);
    console.log(`    Rejected: ${stats.dmcs.rejected}`);

    console.log('\n  Transport:');
    console.log(`    Pending: ${stats.transport.pending}`);
    console.log(`    Approved: ${stats.transport.approved}`);
    console.log(`    Rejected: ${stats.transport.rejected}\n`);

    // Check old application tables
    console.log('📋 Old Application Tables\n');

    const oldTables = [
      'guide_applications',
      'agency_applications',
      'dmc_applications',
      'transport_applications',
    ];

    let oldTablesExist = 0;
    let oldTablesData = 0;

    for (const table of oldTables) {
      const exists = await checkTableExists(client, table);
      if (exists) {
        const count = await getTableRowCount(client, table);
        oldTablesExist++;
        oldTablesData += count;
        const status = count > 0 ? `⚠️  ${count} rows` : '✅ empty';
        console.log(`  ${table}: ${status}`);
      } else {
        console.log(`  ${table}: ✅ removed`);
      }
    }

    // Check deprecated tables
    console.log('\n🗑️  Deprecated Tables\n');

    const deprecatedResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '_deprecated_%'
      ORDER BY table_name;
    `);

    if (deprecatedResult.rows.length > 0) {
      console.log(`  Found ${deprecatedResult.rows.length} deprecated tables:`);
      for (const row of deprecatedResult.rows) {
        const count = await getTableRowCount(client, row.table_name);
        console.log(`    ${row.table_name}: ${count} rows`);
      }
    } else {
      console.log('  No deprecated tables found (Phase 5a not run yet)');
    }

    // Check location junction tables
    console.log('\n📍 Location Junction Tables\n');

    const locationTables = [
      'guide_cities', 'guide_regions', 'guide_countries', 'guide_parks', 'guide_attractions',
      'dmc_cities', 'dmc_regions', 'dmc_countries',
      'transport_cities', 'transport_regions', 'transport_countries',
    ];

    let locationTablesExist = 0;
    let entityLocationsCount = 0;

    for (const table of locationTables) {
      const exists = await checkTableExists(client, table);
      if (exists) {
        const count = await getTableRowCount(client, table);
        locationTablesExist++;
        const status = count > 0 ? `⚠️  ${count} rows` : '✅ empty';
        console.log(`  ${table}: ${status}`);
      }
    }

    if (locationTablesExist === 0) {
      console.log('  All location junction tables removed ✅');
    }

    const entityLocationsExists = await checkTableExists(client, 'entity_locations');
    if (entityLocationsExists) {
      entityLocationsCount = await getTableRowCount(client, 'entity_locations');
      console.log(`\n  entity_locations: ${entityLocationsCount} rows`);
    }

    // Overall status
    console.log('\n=============================================');
    console.log('Overall Status');
    console.log('=============================================\n');

    const phase4Complete = oldTablesExist === 0 || oldTablesData === 0;
    const phase5aComplete = deprecatedResult.rows.length > 0;
    const phase5bComplete = deprecatedResult.rows.length === 0 && oldTablesExist === 0 && locationTablesExist === 0;

    console.log(`  Phase 1-3 (Schema): ${phase1Complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    console.log(`  Phase 4 (Code): ${phase4Complete ? '✅ COMPLETE' : '⚠️  IN PROGRESS'}`);
    console.log(`  Phase 5a (Deprecate): ${phase5aComplete ? '✅ COMPLETE' : '🔄 READY'}`);
    console.log(`  Phase 5b (Cleanup): ${phase5bComplete ? '✅ COMPLETE' : '⏳ PENDING'}`);

    let progress = 0;
    if (phase1Complete) progress += 60;
    if (phase4Complete) progress += 20;
    if (phase5aComplete) progress += 10;
    if (phase5bComplete) progress += 10;

    console.log(`\n  Overall Progress: ${progress}% Complete\n`);

    if (!phase5bComplete) {
      console.log('📝 Next Steps:\n');

      if (!phase4Complete) {
        console.log('  1. Test the application thoroughly');
        console.log('  2. Ensure all new applications use master tables');
      }

      if (!phase5aComplete) {
        console.log('  1. Run comprehensive tests (see PHASE_5_TESTING_GUIDE.md)');
        console.log('  2. Run: node db-consolidation/phase5a_deprecate_tables.js');
      } else if (!phase5bComplete) {
        console.log('  1. Monitor application for 7+ days');
        console.log('  2. Take full database backup');
        console.log('  3. Run: node db-consolidation/phase5b_drop_tables.js');
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error checking database status:');
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
