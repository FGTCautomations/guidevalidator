#!/usr/bin/env node

/**
 * Phase 5a: Deprecate Old Tables (REVERSIBLE)
 *
 * This script renames deprecated tables to _deprecated_* prefix.
 * This is a SAFE operation that can be reversed if issues are found.
 *
 * Tables being deprecated:
 * - 4 application tables (guide_applications, agency_applications, dmc_applications, transport_applications)
 * - 11 location junction tables (guide_cities, guide_regions, etc.)
 *
 * Usage:
 *   node db-consolidation/phase5a_deprecate_tables.js
 *
 * To reverse (if needed):
 *   ALTER TABLE _deprecated_guide_applications RENAME TO guide_applications;
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

const TABLES_TO_DEPRECATE = {
  'Application Tables (4)': [
    'guide_applications',
    'agency_applications',
    'dmc_applications',
    'transport_applications',
  ],
  'Location Junction Tables (11)': [
    'guide_cities',
    'guide_regions',
    'guide_countries',
    'guide_parks',
    'guide_attractions',
    'dmc_cities',
    'dmc_regions',
    'dmc_countries',
    'transport_cities',
    'transport_regions',
    'transport_countries',
  ],
};

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

async function checkTableHasData(client, tableName) {
  try {
    const result = await client.query(`SELECT COUNT(*) FROM ${tableName};`);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    return 0;
  }
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n===========================================');
    console.log('Phase 5a: Deprecate Old Tables (REVERSIBLE)');
    console.log('===========================================\n');

    // Check which tables exist and have data
    console.log('📊 Checking table status...\n');

    const tableStatus = {};
    let totalTables = 0;
    let totalRows = 0;

    for (const [category, tables] of Object.entries(TABLES_TO_DEPRECATE)) {
      console.log(`${category}:`);

      for (const table of tables) {
        const exists = await checkTableExists(client, table);

        if (exists) {
          const rowCount = await checkTableHasData(client, table);
          tableStatus[table] = { exists: true, rowCount };
          totalTables++;
          totalRows += rowCount;

          const status = rowCount > 0 ? `⚠️  ${rowCount} rows` : '✅ empty';
          console.log(`  ${table}: ${status}`);
        } else {
          tableStatus[table] = { exists: false, rowCount: 0 };
          console.log(`  ${table}: ❌ not found (already removed?)`);
        }
      }
      console.log('');
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Tables to deprecate: ${totalTables}`);
    console.log(`   Total rows affected: ${totalRows}`);

    if (totalRows > 0) {
      console.log(`\n⚠️  WARNING: Some tables contain data!`);
      console.log(`   This data will be preserved but inaccessible after renaming.`);
      console.log(`   Make sure you've migrated this data to the new structure first.`);
    }

    // Ask for confirmation
    console.log(`\n⚠️  CONFIRMATION REQUIRED`);
    console.log(`   This will rename ${totalTables} tables to _deprecated_* prefix.`);
    console.log(`   This operation is REVERSIBLE - you can rename them back if needed.`);
    console.log(`\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Begin transaction
    console.log('🔄 Starting deprecation transaction...\n');
    await client.query('BEGIN;');

    let deprecatedCount = 0;
    let skippedCount = 0;

    // Rename tables
    for (const [category, tables] of Object.entries(TABLES_TO_DEPRECATE)) {
      console.log(`\n${category}:`);

      for (const table of tables) {
        if (!tableStatus[table].exists) {
          console.log(`  ⏭️  Skipping ${table} (doesn't exist)`);
          skippedCount++;
          continue;
        }

        try {
          const newName = `_deprecated_${table}`;

          // Check if deprecated version already exists
          const deprecatedExists = await checkTableExists(client, newName);
          if (deprecatedExists) {
            console.log(`  ⚠️  ${table} → ${newName} (already exists, skipping)`);
            skippedCount++;
            continue;
          }

          // Rename table
          await client.query(`ALTER TABLE ${table} RENAME TO ${newName};`);
          console.log(`  ✅ ${table} → ${newName}`);
          deprecatedCount++;

        } catch (error) {
          console.error(`  ❌ Error renaming ${table}:`, error.message);
          throw error;
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT;');

    console.log('\n===========================================');
    console.log('✅ Phase 5a Complete!');
    console.log('===========================================\n');
    console.log(`📊 Results:`);
    console.log(`   Tables deprecated: ${deprecatedCount}`);
    console.log(`   Tables skipped: ${skippedCount}`);
    console.log(`   Total tables processed: ${deprecatedCount + skippedCount}`);

    if (deprecatedCount > 0) {
      console.log(`\n📝 Next Steps:`);
      console.log(`   1. Monitor your application for 7+ days`);
      console.log(`   2. Check logs for any references to deprecated tables`);
      console.log(`   3. If everything works fine, run phase5b_drop_tables.js to permanently remove them`);
      console.log(`\n💡 To reverse this operation (if needed):`);
      console.log(`   ALTER TABLE _deprecated_guide_applications RENAME TO guide_applications;`);
      console.log(`   (repeat for each table)`);
    }

    console.log('\n✅ Phase 5a completed successfully!\n');

  } catch (error) {
    await client.query('ROLLBACK;');
    console.error('\n❌ Error during deprecation:');
    console.error(error);
    console.log('\n🔄 Transaction rolled back - no changes made.\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
