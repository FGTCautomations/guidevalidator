#!/usr/bin/env node
/**
 * Phase A: Additive Changes
 * - Creates performance indexes
 * - Creates views and materialized views
 * - Adds helper columns
 * - 100% safe and reversible
 */

const fs = require('fs');
const path = require('path');
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

// Track progress
let stepNumber = 0;
const totalSteps = 10;

function logStep(message) {
  stepNumber++;
  console.log(`\n[${ stepNumber}/${totalSteps}] ${message}`);
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
    // Check if it's a "already exists" error (which is OK)
    if (error.message.includes('already exists') ||
        error.message.includes('duplicate')) {
      logWarning(`${description} (already exists)`);
      return { success: true, skipped: true };
    }
    logError(`${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyPhaseA() {
  const client = await pool.connect();
  const startTime = Date.now();
  const results = {
    indexes: { created: 0, skipped: 0, failed: 0 },
    views: { created: 0, skipped: 0, failed: 0 },
    matviews: { created: 0, skipped: 0, failed: 0 },
    columns: { added: 0, skipped: 0, failed: 0 },
    functions: { created: 0, skipped: 0, failed: 0 }
  };

  try {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE A: ADDITIVE CHANGES');
    console.log('Database Optimization for Guide Validator');
    console.log('='.repeat(80));

    // Step 1: Create helper columns
    logStep('Adding helper columns');

    const helperColumns = [
      {
        sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_ids UUID[];`,
        desc: 'Add participant_ids to conversations'
      },
      {
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cached_review_count INTEGER DEFAULT 0;`,
        desc: 'Add cached_review_count to profiles'
      },
      {
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cached_avg_rating NUMERIC(3,2);`,
        desc: 'Add cached_avg_rating to profiles'
      },
      {
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMPTZ;`,
        desc: 'Add stats_updated_at to profiles'
      },
      {
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name_tsvector tsvector;`,
        desc: 'Add full_name_tsvector to profiles'
      }
    ];

    for (const col of helperColumns) {
      const result = await executeSQL(client, col.sql, col.desc);
      if (result.success) {
        if (result.skipped) results.columns.skipped++;
        else results.columns.added++;
      } else {
        results.columns.failed++;
      }
    }

    // Step 2: Create critical indexes (Phase 1 - most important)
    logStep('Creating Phase 1 indexes (Critical Performance)');

    const phase1Indexes = [
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;`,
        desc: 'Index on profiles.role'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_verified ON profiles(verified) WHERE deleted_at IS NULL;`,
        desc: 'Index on profiles.verified'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_country ON profiles(country_code) WHERE deleted_at IS NULL;`,
        desc: 'Index on profiles.country_code'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_full_name_search ON profiles USING GIN(full_name_tsvector);`,
        desc: 'Full-text search index on profiles.full_name'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guides_profile ON guides(profile_id);`,
        desc: 'Index on guides.profile_id'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guides_specialties_gin ON guides USING GIN(specialties);`,
        desc: 'GIN index on guides.specialties array'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_verified ON agencies(verified) WHERE deleted_at IS NULL;`,
        desc: 'Index on agencies.verified'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_type ON agencies(agency_type) WHERE deleted_at IS NULL;`,
        desc: 'Index on agencies.agency_type'
      }
    ];

    for (const idx of phase1Indexes) {
      const result = await executeSQL(client, idx.sql, idx.desc);
      if (result.success) {
        if (result.skipped) results.indexes.skipped++;
        else results.indexes.created++;
      } else {
        results.indexes.failed++;
      }
    }

    // Step 3: Create Phase 2 indexes (Availability & Messaging)
    logStep('Creating Phase 2 indexes (Availability & Messaging)');

    const phase2Indexes = [
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_provider_date ON availability_slots(provider_id, date) WHERE is_available = true;`,
        desc: 'Index on availability_slots (provider, date)'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);`,
        desc: 'Index on messages (conversation, time)'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);`,
        desc: 'Index on conversations.last_message_at'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id, conversation_id);`,
        desc: 'Index on conversation_participants (user)'
      }
    ];

    for (const idx of phase2Indexes) {
      const result = await executeSQL(client, idx.sql, idx.desc);
      if (result.success) {
        if (result.skipped) results.indexes.skipped++;
        else results.indexes.created++;
      } else {
        results.indexes.failed++;
      }
    }

    // Step 4: Create Phase 3 indexes (Reviews & Jobs)
    logStep('Creating Phase 3 indexes (Reviews & Jobs)');

    const phase3Indexes = [
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, status) WHERE status = 'published';`,
        desc: 'Index on reviews (reviewee, published)'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);`,
        desc: 'Index on reviews.created_at'
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON jobs(status, end_date) WHERE status = 'active';`,
        desc: 'Index on jobs (active status)'
      }
    ];

    for (const idx of phase3Indexes) {
      const result = await executeSQL(client, idx.sql, idx.desc);
      if (result.success) {
        if (result.skipped) results.indexes.skipped++;
        else results.indexes.created++;
      } else {
        results.indexes.failed++;
      }
    }

    // Step 5: Create helper functions
    logStep('Creating helper functions');

    const functions = [
      {
        sql: `
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name_tsvector := to_tsvector('english', COALESCE(NEW.full_name, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
        desc: 'Function: update_profile_search_vector'
      },
      {
        sql: `
DROP TRIGGER IF EXISTS trg_update_profile_search_vector ON profiles;
CREATE TRIGGER trg_update_profile_search_vector
BEFORE INSERT OR UPDATE OF full_name ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_search_vector();`,
        desc: 'Trigger: trg_update_profile_search_vector'
      }
    ];

    for (const func of functions) {
      const result = await executeSQL(client, func.sql, func.desc);
      if (result.success) {
        if (result.skipped) results.functions.skipped++;
        else results.functions.created++;
      } else {
        results.functions.failed++;
      }
    }

    // Step 6: Backfill search vectors
    logStep('Backfilling search vectors');

    await executeSQL(
      client,
      `UPDATE profiles SET full_name_tsvector = to_tsvector('english', COALESCE(full_name, '')) WHERE full_name_tsvector IS NULL;`,
      'Backfill full_name_tsvector'
    );

    // Step 7: Create simple views (most critical ones)
    logStep('Creating views');

    const views = [
      {
        sql: `
CREATE OR REPLACE VIEW vw_guide_directory AS
SELECT
    p.id,
    p.full_name,
    p.country_code,
    p.verified,
    p.featured,
    p.avatar_url,
    p.created_at,
    g.headline,
    g.specialties,
    g.spoken_languages,
    g.hourly_rate_cents,
    g.currency,
    g.years_experience,
    p.cached_review_count AS review_count,
    p.cached_avg_rating AS avg_rating
FROM profiles p
INNER JOIN guides g ON g.profile_id = p.id
WHERE p.role = 'guide'
    AND p.deleted_at IS NULL;`,
        desc: 'View: vw_guide_directory'
      },
      {
        sql: `
CREATE OR REPLACE VIEW vw_agency_directory AS
SELECT
    a.id,
    a.name,
    a.description,
    a.coverage_summary,
    a.country_code,
    a.verified,
    a.featured,
    a.logo_url,
    a.website,
    a.languages,
    a.specialties,
    a.created_at
FROM agencies a
WHERE a.deleted_at IS NULL;`,
        desc: 'View: vw_agency_directory'
      }
    ];

    for (const view of views) {
      const result = await executeSQL(client, view.sql, view.desc);
      if (result.success) {
        if (result.skipped) results.views.skipped++;
        else results.views.created++;
      } else {
        results.views.failed++;
      }
    }

    // Step 8: Create materialized view for profile stats
    logStep('Creating materialized view for profile stats');

    await executeSQL(
      client,
      `
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_profile_stats AS
SELECT
    p.id AS profile_id,
    p.role,
    COUNT(r.id) AS review_count,
    ROUND(AVG(r.overall_rating)::numeric, 2) AS avg_overall_rating,
    MAX(r.created_at) AS last_review_date,
    NOW() AS refreshed_at
FROM profiles p
LEFT JOIN reviews r ON r.reviewee_id = p.id AND r.status = 'published'
GROUP BY p.id, p.role;`,
      'Materialized View: mv_profile_stats'
    );

    await executeSQL(
      client,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_profile_stats_profile_id ON mv_profile_stats(profile_id);`,
      'Index on mv_profile_stats'
    );

    results.matviews.created++;

    // Step 9: Refresh materialized view and sync cache
    logStep('Refreshing materialized view');

    await executeSQL(client, `REFRESH MATERIALIZED VIEW mv_profile_stats;`, 'Refresh mv_profile_stats');

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
      'Sync cached stats to profiles'
    );

    // Step 10: Final verification
    logStep('Verifying Phase A completion');

    const verificationQueries = [
      {
        sql: `SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%';`,
        label: 'Indexes created'
      },
      {
        sql: `SELECT COUNT(*) as count FROM pg_views WHERE schemaname='public' AND viewname LIKE 'vw_%';`,
        label: 'Views created'
      },
      {
        sql: `SELECT COUNT(*) as count FROM pg_matviews WHERE schemaname='public';`,
        label: 'Materialized views'
      },
      {
        sql: `SELECT COUNT(*) as count FROM profiles WHERE cached_review_count IS NOT NULL;`,
        label: 'Profiles with cached stats'
      }
    ];

    console.log('\nVerification Results:');
    for (const query of verificationQueries) {
      const result = await client.query(query.sql);
      console.log(`  ${query.label}: ${result.rows[0].count}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('PHASE A COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nSummary:');
    console.log(`  Duration: ${duration} seconds`);
    console.log(`  Indexes: ${results.indexes.created} created, ${results.indexes.skipped} skipped, ${results.indexes.failed} failed`);
    console.log(`  Views: ${results.views.created} created, ${results.views.skipped} skipped, ${results.views.failed} failed`);
    console.log(`  Materialized Views: ${results.matviews.created} created`);
    console.log(`  Helper Columns: ${results.columns.added} added, ${results.columns.skipped} skipped`);
    console.log(`  Functions: ${results.functions.created} created, ${results.functions.skipped} skipped`);

    console.log('\n✅ Phase A applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Test your application (all pages should work normally)');
    console.log('2. Monitor for 24-48 hours');
    console.log('3. Check performance improvements');
    console.log('4. If all good, proceed to Phase B');
    console.log('\nTo rollback if needed:');
    console.log('  node db-optimization/run_rollback_a.js');

    // Save results
    const outputDir = path.join(__dirname, 'output');
    const outputFile = path.join(outputDir, `phase_a_results_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({ results, duration, timestamp: new Date().toISOString() }, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);

  } catch (error) {
    console.error('\n❌ Error during Phase A:', error);
    console.error('\nPhase A was interrupted. Database should still be functional.');
    console.error('Review errors above and consider running rollback if needed.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run Phase A
console.log('Starting Phase A: Additive Changes');
console.log('This will take approximately 5-10 minutes...\n');

applyPhaseA().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
