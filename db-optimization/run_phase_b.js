#!/usr/bin/env node
/**
 * Phase B: Verify & Backfill
 * - Run data integrity checks
 * - Create remaining materialized views
 * - Refresh all MVs
 * - Performance benchmarks
 * - Validate everything works
 */

const { Pool } = require('pg');

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

let stepNumber = 0;
const results = {
  integrity: { passed: 0, failed: 0 },
  matviews: { created: 0, refreshed: 0, failed: 0 },
  benchmarks: []
};

function logStep(message) {
  stepNumber++;
  console.log(`\n[${stepNumber}] ${message}`);
  console.log('='.repeat(80));
}

function logSuccess(message) {
  console.log('✓', message);
}

function logWarning(message) {
  console.log('⚠', message);
}

function logError(message) {
  console.error('✗', message);
}

async function executeSQL(client, sql, description) {
  try {
    const result = await client.query(sql);
    logSuccess(description);
    return { success: true, result };
  } catch (error) {
    if (error.message.includes('already exists')) {
      logWarning(`${description} (already exists)`);
      return { success: true, skipped: true };
    }
    logError(`${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runBenchmark(client, name, sql) {
  const start = Date.now();
  try {
    const result = await client.query(sql);
    const duration = Date.now() - start;
    const rowCount = result.rows.length;
    logSuccess(`${name}: ${duration}ms (${rowCount} rows)`);
    results.benchmarks.push({ name, duration, rowCount, success: true });
    return { duration, rowCount };
  } catch (error) {
    const duration = Date.now() - start;
    logError(`${name}: ${error.message}`);
    results.benchmarks.push({ name, duration, error: error.message, success: false });
    return { duration, error: error.message };
  }
}

async function runPhaseB() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE B: VERIFY & BACKFILL');
    console.log('Database Optimization - Testing & Validation');
    console.log('='.repeat(80));

    // Step 1: Data Integrity Checks
    logStep('Running Data Integrity Checks');

    const integrityChecks = [
      {
        sql: `SELECT COUNT(*) as count FROM profiles WHERE id IS NULL;`,
        name: 'Profiles with NULL id',
        expected: 0
      },
      {
        sql: `SELECT COUNT(*) as count FROM guides g LEFT JOIN profiles p ON p.id = g.profile_id WHERE p.id IS NULL;`,
        name: 'Orphaned guides',
        expected: 0
      },
      {
        sql: `SELECT COUNT(*) as count FROM agencies WHERE id IS NULL;`,
        name: 'Agencies with NULL id',
        expected: 0
      },
      {
        sql: `SELECT COUNT(*) as count FROM reviews WHERE overall_rating < 1 OR overall_rating > 5;`,
        name: 'Invalid ratings',
        expected: 0
      },
      {
        sql: `SELECT COUNT(*) as count FROM profiles WHERE country_code IS NOT NULL AND country_code NOT IN (SELECT code FROM countries);`,
        name: 'Invalid country codes',
        expected: 0
      }
    ];

    for (const check of integrityChecks) {
      const result = await client.query(check.sql);
      const count = parseInt(result.rows[0].count);
      if (count === check.expected) {
        logSuccess(`${check.name}: ${count} (OK)`);
        results.integrity.passed++;
      } else {
        logWarning(`${check.name}: ${count} (Expected ${check.expected})`);
        results.integrity.failed++;
      }
    }

    // Step 2: Create additional materialized views
    logStep('Creating Additional Materialized Views');

    const matviews = [
      {
        name: 'mv_agency_stats',
        sql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agency_stats AS
SELECT
    a.id AS agency_id,
    a.type AS agency_type,
    COUNT(DISTINCT am.profile_id) AS team_size,
    COUNT(r.id) AS review_count,
    ROUND(AVG(r.overall_rating)::numeric, 2) AS avg_rating,
    MAX(r.created_at) AS last_review_date,
    NOW() AS refreshed_at
FROM agencies a
LEFT JOIN agency_members am ON am.agency_id = a.id
LEFT JOIN reviews r ON r.reviewee_id = a.id AND r.status = 'published'
GROUP BY a.id, a.type;`,
        index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_agency_stats_agency_id ON mv_agency_stats(agency_id);`
      },
      {
        name: 'mv_conversation_stats',
        sql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conversation_stats AS
SELECT
    c.id AS conversation_id,
    COUNT(m.id) AS total_messages,
    COUNT(DISTINCT m.sender_id) AS unique_senders,
    MIN(m.created_at) AS first_message_at,
    MAX(m.created_at) AS last_message_at,
    COUNT(m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '24 hours') AS messages_last_24h,
    NOW() AS refreshed_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id;`,
        index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_conversation_stats_conv_id ON mv_conversation_stats(conversation_id);`
      },
      {
        name: 'mv_location_popularity',
        sql: `
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_location_popularity AS
SELECT
    c.code AS country_code,
    c.name AS country_name,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'guide') AS guide_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'agency') AS agency_count,
    COUNT(DISTINCT a2.id) FILTER (WHERE a2.type = 'dmc') AS dmc_count,
    COUNT(DISTINCT a3.id) FILTER (WHERE a3.type = 'transport') AS transport_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'guide' AND p.verified = true) AS verified_guide_count,
    NOW() AS refreshed_at
FROM countries c
LEFT JOIN profiles p ON p.country_code = c.code
LEFT JOIN agencies a ON a.country_code = c.code AND a.type = 'agency'
LEFT JOIN agencies a2 ON a2.country_code = c.code AND a2.type = 'dmc'
LEFT JOIN agencies a3 ON a3.country_code = c.code AND a3.type = 'transport'
GROUP BY c.code, c.name;`,
        index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_location_popularity_country ON mv_location_popularity(country_code);`
      }
    ];

    for (const mv of matviews) {
      const result = await executeSQL(client, mv.sql, `MV: ${mv.name}`);
      if (result.success && !result.skipped) {
        results.matviews.created++;
        await executeSQL(client, mv.index, `Index on ${mv.name}`);
      } else if (!result.success) {
        results.matviews.failed++;
      }
    }

    // Step 3: Refresh all materialized views
    logStep('Refreshing All Materialized Views');

    const refreshViews = [
      'mv_profile_stats',
      'mv_agency_stats',
      'mv_conversation_stats',
      'mv_location_popularity'
    ];

    for (const viewName of refreshViews) {
      // Check if view exists first
      const checkResult = await client.query(
        `SELECT matviewname FROM pg_matviews WHERE schemaname='public' AND matviewname=$1;`,
        [viewName]
      );

      if (checkResult.rows.length > 0) {
        const result = await executeSQL(client, `REFRESH MATERIALIZED VIEW ${viewName};`, `Refresh ${viewName}`);
        if (result.success) results.matviews.refreshed++;
      } else {
        logWarning(`${viewName} does not exist, skipping refresh`);
      }
    }

    // Step 4: Sync cached stats to profiles
    logStep('Syncing Cached Stats to Profiles');

    await executeSQL(
      client,
      `
UPDATE profiles p
SET
    cached_review_count = COALESCE(s.review_count, 0),
    cached_avg_rating = s.avg_overall_rating,
    stats_updated_at = NOW()
FROM mv_profile_stats s
WHERE p.id = s.profile_id;`,
      'Sync profile stats cache'
    );

    // Step 5: Performance Benchmarks
    logStep('Running Performance Benchmarks');

    console.log('\nBenchmark: Guide Directory Query');
    await runBenchmark(
      client,
      'Guide directory (old way with subqueries)',
      `
SELECT
    p.id, p.full_name, p.country_code, p.verified,
    g.headline, g.specialties,
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS review_count
FROM profiles p
INNER JOIN guides g ON g.profile_id = p.id
WHERE p.role = 'guide'
LIMIT 50;`
    );

    await runBenchmark(
      client,
      'Guide directory (new way with cached stats)',
      `SELECT * FROM vw_guide_directory LIMIT 50;`
    );

    console.log('\nBenchmark: Profile Stats Query');
    await runBenchmark(
      client,
      'Profile stats (from cache)',
      `SELECT id, full_name, cached_review_count, cached_avg_rating FROM profiles WHERE cached_review_count IS NOT NULL;`
    );

    await runBenchmark(
      client,
      'Profile stats (from materialized view)',
      `SELECT * FROM mv_profile_stats;`
    );

    // Step 6: Index Usage Analysis
    logStep('Analyzing Index Usage');

    const indexUsage = await client.query(`
      SELECT
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY idx_scan DESC
      LIMIT 10;
    `);

    console.log('\nTop 10 Most Used Indexes:');
    if (indexUsage.rows.length > 0) {
      console.table(indexUsage.rows);
    } else {
      logWarning('No index usage data yet (indexes are new)');
    }

    // Step 7: Final Verification
    logStep('Final Verification');

    const verification = [
      {
        sql: `SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%';`,
        label: 'Total indexes'
      },
      {
        sql: `SELECT COUNT(*) as count FROM pg_views WHERE schemaname='public' AND viewname LIKE 'vw_%';`,
        label: 'Total views'
      },
      {
        sql: `SELECT COUNT(*) as count FROM pg_matviews WHERE schemaname='public';`,
        label: 'Materialized views'
      },
      {
        sql: `SELECT COUNT(*) as count FROM pg_matviews WHERE schemaname='public' AND ispopulated=true;`,
        label: 'MVs populated'
      },
      {
        sql: `SELECT COUNT(*) as count FROM profiles WHERE cached_review_count IS NOT NULL;`,
        label: 'Profiles with cached stats'
      },
      {
        sql: `SELECT pg_size_pretty(pg_database_size(current_database())) as size;`,
        label: 'Database size',
        format: 'size'
      }
    ];

    console.log('\nVerification Results:');
    for (const check of verification) {
      const result = await client.query(check.sql);
      const value = check.format === 'size' ? result.rows[0].size : result.rows[0].count;
      console.log(`  ${check.label}: ${value}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('PHASE B COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nSummary:');
    console.log(`  Duration: ${duration} seconds`);
    console.log(`  Integrity checks: ${results.integrity.passed} passed, ${results.integrity.failed} failed`);
    console.log(`  Materialized views: ${results.matviews.created} created, ${results.matviews.refreshed} refreshed`);
    console.log(`  Benchmarks run: ${results.benchmarks.length}`);

    console.log('\n✅ Phase B completed successfully!');
    console.log('\nBenchmark Summary:');
    results.benchmarks.forEach(b => {
      if (b.success) {
        console.log(`  ${b.name}: ${b.duration}ms (${b.rowCount} rows)`);
      }
    });

    console.log('\nNext steps:');
    console.log('1. Monitor application for 24-48 hours');
    console.log('2. Check Supabase dashboard for query performance');
    console.log('3. Verify all features work correctly');
    console.log('4. If stable, proceed to Phase C (constraints & cleanup)');

    // Save results
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, 'output');
    const outputFile = path.join(outputDir, `phase_b_results_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      results,
      duration,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);

  } catch (error) {
    console.error('\n❌ Error during Phase B:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Starting Phase B: Verify & Backfill');
console.log('This will take approximately 2-5 minutes...\n');

runPhaseB().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
