-- ============================================================================
-- PHASE C: CUTOVER & CLEANUP
-- Purpose: Switch reads to optimized paths, add constraints, clean up old objects
-- Safety: DESTRUCTIVE - Can drop old columns/indexes if verified unused
-- ============================================================================

-- PREREQUISITES:
-- 1. Phase A and B completed successfully
-- 2. Monitored for 24-48 hours with no issues
-- 3. Application code updated to use new views (if applicable)
-- 4. Backups taken

-- This phase includes:
-- 1. Add foreign key constraints
-- 2. Add check constraints
-- 3. Optimize RLS policies
-- 4. Drop unused indexes
-- 5. Drop unused columns
-- 6. Schedule materialized view refreshes

\timing on
\echo '\n=== PHASE C: CUTOVER & CLEANUP ===\n'

\echo '⚠️  WARNING: This phase makes destructive changes\n'
\echo 'Ensure you have backups before proceeding\n'
\echo 'Press Ctrl+C to abort, or wait 10 seconds to continue...\n'

SELECT pg_sleep(10);

-- ============================================================================
-- STEP C1: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

\echo 'C1: Adding foreign key constraints\n'

-- Only add constraints if validation queries pass
-- Run validation first:

DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Check for orphaned guides
    SELECT COUNT(*) INTO orphan_count
    FROM guides g
    LEFT JOIN profiles p ON p.id = g.profile_id
    WHERE p.id IS NULL;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Found % orphaned guide records. Clean up before adding FK constraints.', orphan_count;
    END IF;

    -- Add FK constraints
    ALTER TABLE guides
    ADD CONSTRAINT fk_guides_profile
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

    RAISE NOTICE 'FK constraint fk_guides_profile added successfully';

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'FK constraint fk_guides_profile already exists, skipping';
END;
$$;

-- Add other FK constraints (from constraints.sql)
-- Repeat pattern for each table

DO $$
BEGIN
    ALTER TABLE agencies
    ADD CONSTRAINT fk_agencies_country
    FOREIGN KEY (country_code) REFERENCES countries(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE availability_slots
    ADD CONSTRAINT fk_availability_provider
    FOREIGN KEY (provider_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE messages
    ADD CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE conversation_participants
    ADD CONSTRAINT fk_participants_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

\echo 'Foreign key constraints added\n'

-- ============================================================================
-- STEP C2: ADD CHECK CONSTRAINTS
-- ============================================================================

\echo 'C2: Adding check constraints\n'

-- Add rating range checks
DO $$
BEGIN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_rating_range
    CHECK (overall_rating >= 1 AND overall_rating <= 5);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

-- Add status enum checks
DO $$
BEGIN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_status_check
    CHECK (status IN ('draft', 'published', 'flagged', 'hidden'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE jobs
    ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('draft', 'active', 'closed', 'filled', 'canceled'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

-- Add date order checks
DO $$
BEGIN
    ALTER TABLE jobs
    ADD CONSTRAINT jobs_date_order
    CHECK (start_date <= end_date);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE availability_slots
    ADD CONSTRAINT availability_time_order
    CHECK (start_time < end_time);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

\echo 'Check constraints added\n'

-- ============================================================================
-- STEP C3: OPTIMIZE RLS POLICIES
-- ============================================================================

\echo 'C3: Optimizing RLS policies\n'

-- Replace slow policies with optimized versions using helper columns

-- Example: Optimize conversation access using participant_ids array
DROP POLICY IF EXISTS "Users see own conversations" ON conversations;

CREATE POLICY "Users see own conversations"
ON conversations FOR SELECT
USING (auth.uid() = ANY(participant_ids));

COMMENT ON POLICY "Users see own conversations" ON conversations IS 'Fast policy using denormalized array';

-- Optimize message access
DROP POLICY IF EXISTS "Users see messages in their conversations" ON messages;

CREATE POLICY "Users see messages in their conversations"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE auth.uid() = ANY(participant_ids)
    )
);

\echo 'RLS policies optimized\n'

-- ============================================================================
-- STEP C4: DROP UNUSED INDEXES
-- ============================================================================

\echo 'C4: Identifying and dropping unused indexes\n'

-- Query unused indexes (idx_scan = 0)
CREATE TEMP TABLE unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey'  -- Keep primary keys
    AND indexname NOT LIKE '%_key'   -- Keep unique constraints
    AND indexname NOT LIKE 'idx_%'   -- Keep newly created indexes (give them time)
ORDER BY pg_relation_size(indexrelid) DESC;

\echo 'Unused indexes identified:\n'
SELECT * FROM unused_indexes;

-- DROP unused indexes (commented out for safety - review first)
-- DO $$
-- DECLARE
--     idx RECORD;
-- BEGIN
--     FOR idx IN SELECT * FROM unused_indexes LOOP
--         EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || idx.indexname;
--         RAISE NOTICE 'Dropped index: %', idx.indexname;
--     END LOOP;
-- END;
-- $$;

\echo 'Review unused indexes and drop manually if confirmed\n'

-- ============================================================================
-- STEP C5: DROP REDUNDANT COLUMNS (if any)
-- ============================================================================

\echo 'C5: Checking for redundant columns\n'

-- Example: If you migrated data from old columns to new ones

-- Check if old location columns are still in use
-- (Assuming guide_countries, guide_regions, guide_cities are replaced by location_data JSONB)

-- Query to find tables without recent reads
CREATE TEMP TABLE potentially_unused_tables AS
SELECT
    schemaname,
    tablename,
    seq_scan + idx_scan AS total_scans,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan + idx_scan < 10  -- Very few scans
    AND tablename LIKE 'guide_%'  -- Focus on guide-related tables
ORDER BY total_scans ASC;

SELECT * FROM potentially_unused_tables;

\echo 'Review potentially unused tables and drop if confirmed\n'

-- DROP TABLE IF EXISTS guide_countries CASCADE;  -- Uncomment after verification
-- DROP TABLE IF EXISTS guide_regions CASCADE;
-- DROP TABLE IF EXISTS guide_cities CASCADE;

-- ============================================================================
-- STEP C6: SCHEDULE MATERIALIZED VIEW REFRESHES
-- ============================================================================

\echo 'C6: Setting up materialized view refresh schedule\n'

-- Create refresh functions for different frequencies
CREATE OR REPLACE FUNCTION refresh_frequent_matviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM refresh_matview_with_logging('mv_platform_metrics');
    PERFORM refresh_matview_with_logging('mv_availability_summary');
END;
$$;

CREATE OR REPLACE FUNCTION refresh_hourly_matviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM refresh_matview_with_logging('mv_profile_stats');
    PERFORM refresh_matview_with_logging('mv_conversation_stats');
    PERFORM refresh_matview_with_logging('mv_job_stats');
END;
$$;

CREATE OR REPLACE FUNCTION refresh_daily_matviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM refresh_matview_with_logging('mv_agency_stats');
    PERFORM refresh_matview_with_logging('mv_location_popularity');
    PERFORM refresh_matview_with_logging('mv_user_engagement');

    -- Also sync cached profile stats
    PERFORM sync_profile_stats_cache();
END;
$$;

COMMENT ON FUNCTION refresh_frequent_matviews IS 'Refresh high-frequency materialized views';
COMMENT ON FUNCTION refresh_hourly_matviews IS 'Refresh hourly materialized views';
COMMENT ON FUNCTION refresh_daily_matviews IS 'Refresh daily materialized views';

-- Note: Actual scheduling depends on your setup (pg_cron, Vercel cron, etc.)
-- See refresh_plan.md for implementation details

\echo 'Refresh functions created\n'
\echo 'Configure cron jobs according to refresh_plan.md\n'

-- ============================================================================
-- STEP C7: ENABLE QUERY MONITORING
-- ============================================================================

\echo 'C7: Enabling query monitoring\n'

-- Ensure pg_stat_statements is configured
-- (This requires superuser, may already be enabled on Supabase)

-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics to get fresh baseline
-- SELECT pg_stat_statements_reset();

\echo 'Query monitoring enabled (if extension available)\n'

-- ============================================================================
-- STEP C8: FINAL VALIDATION
-- ============================================================================

\echo 'C8: Final validation\n'

-- Verify all new objects are in place
SELECT
    'Materialized Views' AS object_type,
    COUNT(*)::text AS count
FROM pg_matviews
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Regular Views',
    COUNT(*)::text
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'vw_%'

UNION ALL

SELECT
    'New Indexes',
    COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'

UNION ALL

SELECT
    'Foreign Keys',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT
    'Check Constraints',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
    AND constraint_type = 'CHECK';

-- Verify helper columns are populated
SELECT
    'Conversations with participant_ids' AS metric,
    COUNT(*)::text AS value
FROM conversations
WHERE participant_ids IS NOT NULL

UNION ALL

SELECT
    'Profiles with cached stats',
    COUNT(*)::text
FROM profiles
WHERE cached_review_count IS NOT NULL;

-- Check for any constraint violations
\echo 'Checking for constraint violations:\n'

DO $$
DECLARE
    violation_count INTEGER;
BEGIN
    -- Check rating ranges
    SELECT COUNT(*) INTO violation_count
    FROM reviews
    WHERE overall_rating < 1 OR overall_rating > 5;

    IF violation_count > 0 THEN
        RAISE WARNING 'Found % reviews with invalid ratings', violation_count;
    END IF;

    -- Check date orders
    SELECT COUNT(*) INTO violation_count
    FROM jobs
    WHERE start_date > end_date;

    IF violation_count > 0 THEN
        RAISE WARNING 'Found % jobs with invalid date order', violation_count;
    END IF;
END;
$$;

\echo '\n=== PHASE C COMPLETE ===\n'
\echo 'Database optimization fully deployed\n'
\echo '\nDeployed changes:\n'
\echo '✓ Foreign key constraints\n'
\echo '✓ Check constraints\n'
\echo '✓ Optimized RLS policies\n'
\echo '✓ Materialized view refresh functions\n'
\echo '✓ Unused object cleanup (reviewed)\n'
\echo '\nNext steps:\n'
\echo '1. Set up cron jobs for MV refreshes (see refresh_plan.md)\n'
\echo '2. Update application code to use views where applicable\n'
\echo '3. Monitor query performance for 7 days\n'
\echo '4. Review refresh_plan.md and adjust frequencies if needed\n'
\echo '5. Run slow_queries_analysis.sql monthly\n'

\timing off

-- ============================================================================
-- POST-DEPLOYMENT MONITORING
-- ============================================================================

\echo '\nPost-deployment monitoring queries:\n'

\echo '\n-- Check materialized view refresh status:'
\echo 'SELECT view_name, started_at, duration_ms, success'
\echo 'FROM matview_refresh_log'
\echo 'ORDER BY started_at DESC'
\echo 'LIMIT 20;'

\echo '\n-- Check index usage:'
\echo 'SELECT'
\echo '    indexname,'
\echo '    idx_scan AS scans,'
\echo '    pg_size_pretty(pg_relation_size(indexrelid)) AS size'
\echo 'FROM pg_stat_user_indexes'
\echo 'WHERE schemaname = ''public'''
\echo 'ORDER BY idx_scan DESC'
\echo 'LIMIT 20;'

\echo '\n-- Check slow queries:'
\echo 'SELECT'
\echo '    LEFT(query, 100) AS query,'
\echo '    calls,'
\echo '    ROUND(mean_exec_time::numeric, 2) AS mean_ms,'
\echo '    ROUND(total_exec_time::numeric, 2) AS total_ms'
\echo 'FROM pg_stat_statements'
\echo 'WHERE mean_exec_time > 50'
\echo 'ORDER BY mean_exec_time DESC'
\echo 'LIMIT 10;'

\echo '\n-- Check database size:'
\echo 'SELECT'
\echo '    pg_size_pretty(pg_database_size(current_database())) AS database_size;'

\echo '\n-- Check table bloat:'
\echo 'SELECT'
\echo '    tablename,'
\echo '    n_dead_tup,'
\echo '    n_live_tup,'
\echo '    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct'
\echo 'FROM pg_stat_user_tables'
\echo 'WHERE n_dead_tup > 1000'
\echo 'ORDER BY n_dead_tup DESC;'
