#!/usr/bin/env node

/**
 * Phase 5b: Drop Deprecated Tables (PERMANENT)
 *
 * This script PERMANENTLY drops tables with _deprecated_ prefix.
 * This operation CANNOT be reversed - make sure you have backups!
 *
 * Prerequisites:
 * - Phase 5a must be completed (tables renamed to _deprecated_*)
 * - Application must be monitored for 7+ days with no issues
 * - Full database backup must be taken
 *
 * Usage:
 *   node db-consolidation/phase5b_drop_tables.js
 *
 * ⚠️  WARNING: This operation is PERMANENT and IRREVERSIBLE!
 */

const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function getDeprecatedTables(client) {
  const result = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name LIKE '_deprecated_%'
     ORDER BY table_name;`
  );
  return result.rows.map(row => row.table_name);
}

async function getTableSize(client, tableName) {
  try {
    const result = await client.query(
      `SELECT
        pg_size_pretty(pg_total_relation_size($1::regclass)) as size,
        (SELECT COUNT(*) FROM ${tableName}) as row_count;`,
      [tableName]
    );
    return result.rows[0];
  } catch (error) {
    return { size: 'unknown', row_count: 0 };
  }
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n================================================');
    console.log('Phase 5b: Drop Deprecated Tables (PERMANENT)');
    console.log('================================================\n');

    console.log('⚠️  WARNING: This operation is PERMANENT and IRREVERSIBLE!\n');

    // Get list of deprecated tables
    console.log('🔍 Searching for deprecated tables...\n');
    const deprecatedTables = await getDeprecatedTables(client);

    if (deprecatedTables.length === 0) {
      console.log('✅ No deprecated tables found. Nothing to do!\n');
      return;
    }

    console.log(`Found ${deprecatedTables.length} deprecated tables:\n`);

    let totalRows = 0;
    const tableInfo = [];

    for (const table of deprecatedTables) {
      const info = await getTableSize(client, table);
      tableInfo.push({ name: table, ...info });
      totalRows += parseInt(info.row_count, 10);
      console.log(`  ${table}:`);
      console.log(`    Size: ${info.size}`);
      console.log(`    Rows: ${info.row_count}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Tables to drop: ${deprecatedTables.length}`);
    console.log(`   Total rows: ${totalRows.toLocaleString()}`);

    // Safety checks
    console.log(`\n🛡️  Safety Checklist:\n`);
    console.log(`   [ ] Phase 5a completed (tables renamed to _deprecated_*)`);
    console.log(`   [ ] Application monitored for 7+ days with no issues`);
    console.log(`   [ ] Full database backup taken and verified`);
    console.log(`   [ ] All team members notified`);
    console.log(`   [ ] Ready to permanently delete ${totalRows.toLocaleString()} rows\n`);

    // Triple confirmation
    console.log('⚠️  TRIPLE CONFIRMATION REQUIRED\n');

    const answer1 = await question('Type "I HAVE A BACKUP" to continue: ');
    if (answer1.trim() !== 'I HAVE A BACKUP') {
      console.log('\n❌ Confirmation failed. Aborting.\n');
      return;
    }

    const answer2 = await question(`Type the number of tables to drop (${deprecatedTables.length}): `);
    if (answer2.trim() !== String(deprecatedTables.length)) {
      console.log('\n❌ Confirmation failed. Aborting.\n');
      return;
    }

    const answer3 = await question('Type "DELETE PERMANENTLY" to confirm: ');
    if (answer3.trim() !== 'DELETE PERMANENTLY') {
      console.log('\n❌ Confirmation failed. Aborting.\n');
      return;
    }

    console.log('\n🔄 Starting deletion transaction...\n');
    await client.query('BEGIN;');

    let droppedCount = 0;
    let errorCount = 0;

    for (const table of deprecatedTables) {
      try {
        console.log(`  🗑️  Dropping ${table}...`);
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        console.log(`  ✅ ${table} dropped`);
        droppedCount++;
      } catch (error) {
        console.error(`  ❌ Error dropping ${table}:`, error.message);
        errorCount++;
      }
    }

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} errors occurred. Rolling back transaction...`);
      await client.query('ROLLBACK;');
      console.log('❌ Transaction rolled back - no changes made.\n');
      return;
    }

    // Final confirmation before commit
    console.log(`\n⚠️  FINAL CONFIRMATION`);
    console.log(`   About to permanently delete ${droppedCount} tables and ${totalRows.toLocaleString()} rows.`);
    const finalAnswer = await question('Type "COMMIT" to finalize: ');

    if (finalAnswer.trim() !== 'COMMIT') {
      console.log('\n🔄 Rolling back transaction...');
      await client.query('ROLLBACK;');
      console.log('❌ Transaction rolled back - no changes made.\n');
      return;
    }

    // Commit transaction
    await client.query('COMMIT;');

    console.log('\n================================================');
    console.log('✅ Phase 5b Complete!');
    console.log('================================================\n');
    console.log(`📊 Results:`);
    console.log(`   Tables dropped: ${droppedCount}`);
    console.log(`   Rows deleted: ${totalRows.toLocaleString()}`);
    console.log(`   Errors: ${errorCount}`);

    console.log(`\n🎉 Database Consolidation Complete!\n`);
    console.log(`   Original table count: 82`);
    console.log(`   Tables removed: ${droppedCount}`);
    console.log(`   New table count: ~${82 - droppedCount}`);
    console.log(`   Reduction: ${Math.round((droppedCount / 82) * 100)}%`);

    console.log(`\n📝 Post-Cleanup Tasks:`);
    console.log(`   1. Run VACUUM ANALYZE to reclaim disk space`);
    console.log(`   2. Update database documentation`);
    console.log(`   3. Verify application still works correctly`);
    console.log(`   4. Update backup/restore procedures\n`);

  } catch (error) {
    await client.query('ROLLBACK;');
    console.error('\n❌ Error during cleanup:');
    console.error(error);
    console.log('\n🔄 Transaction rolled back - no changes made.\n');
    process.exit(1);
  } finally {
    rl.close();
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
