#!/usr/bin/env node
/**
 * Database Statistics Collection Script
 * Connects to Supabase and runs collect_stats.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection - using object notation to handle special characters in password
const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runStatistics() {
  const client = await pool.connect();

  try {
    console.log('✓ Connected to Supabase database');
    console.log('Running statistics collection...\n');

    // Test connection
    const dbInfo = await client.query('SELECT current_database() as database, version() as version;');
    console.log('Database:', dbInfo.rows[0].database);
    console.log('Version:', dbInfo.rows[0].version.split('\n')[0]);
    console.log('\n' + '='.repeat(80) + '\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'collect_stats.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split into individual statements (rough split by sections)
    const sections = [
      // Section 1: Schema Inventory
      `SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`,

      // Section 2: Row counts
      `SELECT
        schemaname,
        relname as tablename,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;`,

      // Section 3: Index usage
      `SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;`,

      // Section 4: Tables without primary keys
      `SELECT
        t.tablename
      FROM pg_tables t
      LEFT JOIN (
        SELECT tablename
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexdef LIKE '%PRIMARY KEY%'
      ) pk ON t.tablename = pk.tablename
      WHERE t.schemaname = 'public'
        AND pk.tablename IS NULL
      ORDER BY t.tablename;`,

      // Section 5: Missing indexes on foreign key columns
      `SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;`,

      // Section 6: RLS policies
      `SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual as using_clause
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;`,

      // Section 7: Tables without RLS
      `SELECT
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;`,

      // Section 8: Unused indexes (never scanned)
      `SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexrelid) DESC;`
    ];

    const sectionTitles = [
      'SECTION 1: TABLE SIZES',
      'SECTION 2: ROW COUNTS',
      'SECTION 3: INDEX USAGE',
      'SECTION 4: TABLES WITHOUT PRIMARY KEYS',
      'SECTION 5: FOREIGN KEY COLUMNS (potential missing indexes)',
      'SECTION 6: RLS POLICIES',
      'SECTION 7: TABLES RLS STATUS',
      'SECTION 8: UNUSED INDEXES'
    ];

    let output = '';

    for (let i = 0; i < sections.length; i++) {
      console.log('\n' + sectionTitles[i]);
      console.log('='.repeat(80));

      try {
        const result = await client.query(sections[i]);

        if (result.rows.length === 0) {
          console.log('(No results)');
          output += `\n${sectionTitles[i]}\n${'='.repeat(80)}\n(No results)\n`;
        } else {
          console.table(result.rows);
          output += `\n${sectionTitles[i]}\n${'='.repeat(80)}\n`;
          output += JSON.stringify(result.rows, null, 2) + '\n';
        }
      } catch (err) {
        console.error(`Error in ${sectionTitles[i]}:`, err.message);
        output += `\n${sectionTitles[i]}\n${'='.repeat(80)}\nERROR: ${err.message}\n`;
      }
    }

    // Save to file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputFile = path.join(outputDir, `stats_report_${new Date().toISOString().split('T')[0]}.txt`);
    fs.writeFileSync(outputFile, output);

    console.log('\n' + '='.repeat(80));
    console.log('✓ Statistics collection complete!');
    console.log(`Report saved to: ${outputFile}`);
    console.log('\nNext steps:');
    console.log('1. Review the report above');
    console.log('2. Run: node db-optimization/run_hygiene.js (schema hygiene checks)');
    console.log('3. Review: db-optimization/STEP_BY_STEP_GUIDE.md');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
runStatistics().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
