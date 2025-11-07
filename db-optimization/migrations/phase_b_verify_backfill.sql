-- ============================================================================
-- PHASE B: VERIFY & BACKFILL
-- Purpose: Test new objects, backfill data, run initial refreshes
-- Safety: Read-heavy phase, can be paused/resumed
-- ============================================================================

-- This phase includes:
-- 1. Initial materialized view refresh
-- 2. Verify data integrity
-- 3. Backfill cached columns
-- 4. Performance testing
-- 5. Monitor for issues

\timing on
\echo '\n=== PHASE B: VERIFY & BACKFILL ===\n'

-- ============================================================================
-- STEP B1: INITIAL MATERIALIZED VIEW REFRESH
-- ============================================================================

\echo 'B1: Performing initial materialized view refresh\n'

-- Refresh all materialized views for the first time
-- This may take several minutes depending on data volume

\echo 'Refreshing mv_profile_stats...'
REFRESH MATERIALIZED VIEW mv_profile_stats;

\echo 'Refreshing mv_agency_stats...'
REFRESH MATERIALIZED VIEW mv_agency_stats;

\echo 'Refreshing mv_availability_summary...'
REFRESH MATERIALIZED VIEW mv_availability_summary;

\echo 'Refreshing mv_conversation_stats...'
REFRESH MATERIALIZED VIEW mv_conversation_stats;

\echo 'Refreshing mv_job_stats...'
REFRESH MATERIALIZED VIEW mv_job_stats;

\echo 'Refreshing mv_location_popularity...'
REFRESH MATERIALIZED VIEW mv_location_popularity;

\echo 'Refreshing mv_platform_metrics...'
REFRESH MATERIALIZED VIEW mv_platform_metrics;

\echo 'Refreshing mv_user_engagement...'
REFRESH MATERIALIZED VIEW mv_user_engagement;

\echo 'All materialized views refreshed\n'

-- ============================================================================
-- STEP B2: VERIFY DATA INTEGRITY
-- ============================================================================

\echo 'B2: Verifying data integrity\n'

-- Check for NULL values in critical fields
\echo 'Checking for NULL violations:\n'

SELECT
    'profiles.id' AS check_name,
    COUNT(*) AS violations
FROM profiles
WHERE id IS NULL

UNION ALL

SELECT
    'profiles.created_at',
    COUNT(*)
FROM profiles
WHERE created_at IS NULL

UNION ALL

SELECT
    'guides.profile_id',
    COUNT(*)
FROM guides
WHERE profile_id IS NULL

UNION ALL

SELECT
    'messages.conversation_id',
    COUNT(*)
FROM messages
WHERE conversation_id IS NULL;

-- Check for orphaned records
\echo 'Checking for orphaned records:\n'

SELECT
    'orphaned guides' AS check_name,
    COUNT(*) AS count
FROM guides g
LEFT JOIN profiles p ON p.id = g.profile_id
WHERE p.id IS NULL

UNION ALL

SELECT
    'orphaned agency_members',
    COUNT(*)
FROM agency_members am
LEFT JOIN agencies a ON a.id = am.agency_id
WHERE a.id IS NULL

UNION ALL

SELECT
    'orphaned messages',
    COUNT(*)
FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL;

-- Check for invalid country codes
\echo 'Checking for invalid country codes:\n'

SELECT
    'profiles' AS table_name,
    country_code,
    COUNT(*) AS count
FROM profiles
WHERE country_code IS NOT NULL
    AND country_code NOT IN (SELECT code FROM countries)
GROUP BY country_code

UNION ALL

SELECT
    'agencies',
    country_code,
    COUNT(*)
FROM agencies
WHERE country_code IS NOT NULL
    AND country_code NOT IN (SELECT code FROM countries)
GROUP BY country_code;

-- Check for invalid ratings
\echo 'Checking for invalid ratings:\n'

SELECT
    COUNT(*) AS invalid_ratings
FROM reviews
WHERE overall_rating < 1 OR overall_rating > 5;

-- Check for date order violations
\echo 'Checking for date order violations:\n'

SELECT
    COUNT(*) AS invalid_job_dates
FROM jobs
WHERE start_date > end_date

UNION ALL

SELECT
    COUNT(*) AS invalid_availability_times
FROM availability_slots
WHERE start_time >= end_time;

\echo 'Data integrity checks complete\n'

-- ============================================================================
-- STEP B3: BACKFILL CACHED COLUMNS
-- ============================================================================

\echo 'B3: Backfilling cached columns\n'

-- Sync profile stats from materialized view to cache columns
SELECT sync_profile_stats_cache();

\echo 'Profile stats cache updated\n'

-- Verify cache accuracy
SELECT
    p.id,
    p.cached_review_count,
    s.review_count AS actual_count,
    p.cached_avg_rating,
    s.avg_overall_rating AS actual_rating,
    CASE
        WHEN p.cached_review_count = s.review_count THEN 'OK'
        ELSE 'MISMATCH'
    END AS status
FROM profiles p
JOIN mv_profile_stats s ON s.profile_id = p.id
WHERE p.cached_review_count IS NOT NULL
LIMIT 10;

-- ============================================================================
-- STEP B4: PERFORMANCE TESTING
-- ============================================================================

\echo 'B4: Performance testing\n'

-- Test 1: Guide directory query (old vs new)
\echo 'Test 1: Guide directory performance\n'

-- Old way (direct query with subqueries)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    p.id,
    p.full_name,
    p.country_code,
    p.verified,
    g.headline,
    g.specialties,
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS avg_rating
FROM profiles p
INNER JOIN guides g ON g.profile_id = p.id
WHERE p.role = 'guide' AND p.deleted_at IS NULL
LIMIT 50;

-- New way (using view + materialized view)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    d.*,
    s.review_count,
    s.avg_overall_rating
FROM vw_guide_directory d
LEFT JOIN mv_profile_stats s ON s.profile_id = d.id
LIMIT 50;

-- Test 2: User inbox query
\echo 'Test 2: User inbox performance\n'

-- Using view
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM vw_user_conversations
WHERE user_id = (SELECT id FROM profiles LIMIT 1)
ORDER BY last_message_at DESC
LIMIT 20;

-- Test 3: Profile with stats
\echo 'Test 3: Profile detail with cached stats\n'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
    p.*,
    p.cached_review_count,
    p.cached_avg_rating
FROM profiles p
WHERE p.id = (SELECT id FROM profiles LIMIT 1);

\echo 'Performance tests complete. Review EXPLAIN output above.\n'

-- ============================================================================
-- STEP B5: INDEX USAGE MONITORING
-- ============================================================================

\echo 'B5: Monitoring index usage\n'

-- Record baseline index stats
CREATE TEMP TABLE baseline_index_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    NOW() AS captured_at
FROM pg_stat_user_indexes
WHERE schemaname = 'public';

\echo 'Baseline index stats captured\n'
\echo 'Wait 24-48 hours and compare with:\n'
\echo 'SELECT * FROM pg_stat_user_indexes WHERE schemaname = ''public'' AND idx_scan > 0 ORDER BY idx_scan DESC;\n'

-- ============================================================================
-- STEP B6: MATERIALIZED VIEW REFRESH TESTING
-- ============================================================================

\echo 'B6: Testing materialized view refresh\n'

-- Test logged refresh
SELECT refresh_matview_with_logging('mv_profile_stats');

-- Check refresh log
SELECT
    view_name,
    duration_ms,
    success,
    error_message
FROM matview_refresh_log
ORDER BY started_at DESC
LIMIT 5;

\echo 'Materialized view refresh tested\n'

-- ============================================================================
-- STEP B7: VIEW DEPENDENCY CHECK
-- ============================================================================

\echo 'B7: Checking view dependencies\n'

-- List all views and their dependencies
SELECT
    dependent_ns.nspname AS dependent_schema,
    dependent_view.relname AS dependent_view,
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class AS source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace AS dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace AS source_ns ON source_ns.oid = source_table.relnamespace
WHERE dependent_ns.nspname = 'public'
    AND source_ns.nspname = 'public'
    AND dependent_view.relkind IN ('v', 'm')
ORDER BY dependent_view.relname;

-- ============================================================================
-- STEP B8: DATA VALIDATION SUMMARY
-- ============================================================================

\echo 'B8: Data validation summary\n'

-- Summary of all checks
SELECT
    'Total Profiles' AS metric,
    COUNT(*)::text AS value
FROM profiles

UNION ALL

SELECT
    'Profiles with Cached Stats',
    COUNT(*)::text
FROM profiles
WHERE cached_review_count IS NOT NULL

UNION ALL

SELECT
    'Materialized Views',
    COUNT(*)::text
FROM pg_matviews
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Materialized Views Populated',
    COUNT(*)::text
FROM pg_matviews
WHERE schemaname = 'public' AND ispopulated = true

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
    'Conversations with Participant Arrays',
    COUNT(*)::text
FROM conversations
WHERE participant_ids IS NOT NULL;

\echo '\n=== PHASE B COMPLETE ===\n'
\echo 'All new objects verified and populated\n'
\echo '\nNext steps:\n'
\echo '1. Monitor performance for 24-48 hours\n'
\echo '2. Review slow query logs\n'
\echo '3. If no issues, proceed to Phase C\n'
\echo '4. If issues found, see phase_b_rollback.sql\n'

\timing off

-- ============================================================================
-- MONITORING QUERIES (Run periodically)
-- ============================================================================

\echo '\nMonitoring queries to run over next 24-48 hours:\n'

\echo '\n-- Check materialized view freshness:'
\echo 'SELECT'
\echo '    schemaname,'
\echo '    matviewname,'
\echo '    (SELECT refreshed_at FROM mv_profile_stats LIMIT 1) AS last_refreshed'
\echo 'FROM pg_matviews'
\echo 'WHERE schemaname = ''public'';'

\echo '\n-- Check index usage growth:'
\echo 'SELECT'
\echo '    indexname,'
\echo '    idx_scan AS scans,'
\echo '    idx_tup_read AS tuples_read'
\echo 'FROM pg_stat_user_indexes'
\echo 'WHERE schemaname = ''public'''
\echo '    AND indexname LIKE ''idx_%'''
\echo 'ORDER BY idx_scan DESC'
\echo 'LIMIT 20;'

\echo '\n-- Check for slow queries:'
\echo 'SELECT'
\echo '    LEFT(query, 80) AS query_preview,'
\echo '    calls,'
\echo '    ROUND(mean_exec_time::numeric, 2) AS mean_ms'
\echo 'FROM pg_stat_statements'
\echo 'WHERE mean_exec_time > 100'
\echo 'ORDER BY mean_exec_time DESC'
\echo 'LIMIT 10;'
