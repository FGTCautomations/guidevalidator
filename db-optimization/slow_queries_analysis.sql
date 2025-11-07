-- ============================================================================
-- SLOW QUERIES ANALYSIS for Guide Validator
-- Purpose: Identify and analyze slow queries with execution plans
-- Requires: pg_stat_statements extension enabled
-- ============================================================================

\timing on
\echo '\n=== SLOW QUERIES ANALYSIS ===\n'

-- ============================================================================
-- SECTION 1: ENABLE pg_stat_statements (if not already enabled)
-- ============================================================================

\echo '1. Checking pg_stat_statements extension:\n'

-- Note: This requires superuser or rds_superuser privileges
-- On Supabase, this should already be enabled
SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';

-- If not enabled, uncomment:
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- SECTION 2: TOP 50 QUERIES BY TOTAL TIME
-- ============================================================================

\echo '\n2. TOP 50 QUERIES BY TOTAL EXECUTION TIME:\n'

SELECT
    queryid,
    LEFT(query, 120) AS query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(min_exec_time::numeric, 2) AS min_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
    ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total_time,
    rows AS total_rows,
    ROUND((rows / NULLIF(calls, 0))::numeric, 2) AS avg_rows_per_call,
    ROUND((shared_blks_hit / NULLIF(calls, 0))::numeric, 2) AS avg_buffers_hit,
    ROUND((shared_blks_read / NULLIF(calls, 0))::numeric, 2) AS avg_buffers_read
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
    AND query NOT LIKE '%information_schema%'
ORDER BY total_exec_time DESC
LIMIT 50;

-- ============================================================================
-- SECTION 3: TOP 50 QUERIES BY MEAN EXECUTION TIME
-- ============================================================================

\echo '\n3. TOP 50 QUERIES BY MEAN EXECUTION TIME:\n'

SELECT
    queryid,
    LEFT(query, 120) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    ROUND(min_exec_time::numeric, 2) AS min_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    rows AS total_rows,
    ROUND((rows / NULLIF(calls, 0))::numeric, 2) AS avg_rows_per_call
FROM pg_stat_statements
WHERE calls > 10
    AND query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
ORDER BY mean_exec_time DESC
LIMIT 50;

-- ============================================================================
-- SECTION 4: QUERIES WITH HIGH BUFFER READS (I/O intensive)
-- ============================================================================

\echo '\n4. I/O INTENSIVE QUERIES (High disk reads):\n'

SELECT
    queryid,
    LEFT(query, 120) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    shared_blks_read AS disk_blocks_read,
    shared_blks_hit AS cache_blocks_hit,
    ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_ratio_pct,
    ROUND((shared_blks_read / NULLIF(calls, 0))::numeric, 2) AS avg_disk_reads_per_call
FROM pg_stat_statements
WHERE shared_blks_read > 0
    AND query NOT LIKE '%pg_stat_statements%'
ORDER BY shared_blks_read DESC
LIMIT 30;

-- ============================================================================
-- SECTION 5: QUERIES WITH HIGH ROW COUNTS (Potential full table scans)
-- ============================================================================

\echo '\n5. QUERIES RETURNING MANY ROWS (Potential full scans):\n'

SELECT
    queryid,
    LEFT(query, 120) AS query_preview,
    calls,
    rows AS total_rows,
    ROUND((rows / NULLIF(calls, 0))::numeric, 2) AS avg_rows_per_call,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms
FROM pg_stat_statements
WHERE rows > 1000
    AND query NOT LIKE '%pg_stat_statements%'
ORDER BY (rows / NULLIF(calls, 0)) DESC
LIMIT 30;

-- ============================================================================
-- SECTION 6: MOST FREQUENTLY CALLED QUERIES
-- ============================================================================

\echo '\n6. MOST FREQUENTLY CALLED QUERIES:\n'

SELECT
    queryid,
    LEFT(query, 120) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total_time,
    ROUND((rows / NULLIF(calls, 0))::numeric, 2) AS avg_rows_per_call
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
ORDER BY calls DESC
LIMIT 30;

-- ============================================================================
-- SECTION 7: SEQUENTIAL SCANS ON LARGE TABLES
-- ============================================================================

\echo '\n7. TABLES WITH FREQUENT SEQUENTIAL SCANS:\n'

SELECT
    schemaname,
    tablename,
    seq_scan AS sequential_scans,
    seq_tup_read AS rows_read_seq,
    idx_scan AS index_scans,
    idx_tup_fetch AS rows_read_idx,
    n_live_tup AS live_rows,
    ROUND((seq_tup_read / NULLIF(seq_scan, 0))::numeric, 2) AS avg_rows_per_seq_scan,
    CASE
        WHEN seq_scan > idx_scan AND n_live_tup > 1000 THEN 'NEEDS_INDEX'
        WHEN seq_scan > idx_scan THEN 'REVIEW'
        ELSE 'OK'
    END AS status
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 30;

-- ============================================================================
-- SECTION 8: QUERY FINGERPRINTS (Aggregated patterns)
-- ============================================================================

\echo '\n8. QUERY PATTERNS BY FINGERPRINT:\n'

-- Group similar queries by removing literals
SELECT
    COUNT(*) AS pattern_count,
    SUM(calls) AS total_calls,
    ROUND(SUM(total_exec_time)::numeric, 2) AS total_time_ms,
    ROUND(AVG(mean_exec_time)::numeric, 2) AS avg_mean_time_ms,
    LEFT(MIN(query), 120) AS example_query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
GROUP BY LEFT(query, 100)
HAVING COUNT(*) > 1
ORDER BY SUM(total_exec_time) DESC
LIMIT 30;

-- ============================================================================
-- SECTION 9: FULL QUERY TEXT FOR TOP 10 SLOWEST
-- ============================================================================

\echo '\n9. FULL QUERY TEXT FOR TOP 10 SLOWEST QUERIES:\n'
\echo '(Copy these for EXPLAIN ANALYZE):\n'

SELECT
    queryid,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    query AS full_query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
    AND query NOT LIKE '%information_schema%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================================
-- SECTION 10: EXPLAIN ANALYZE TEMPLATES
-- ============================================================================

\echo '\n10. INSTRUCTIONS FOR EXPLAIN ANALYZE:\n'
\echo 'For each slow query above, run:\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) <your_query>;\n'
\echo '\n'
\echo 'Example for directory search:\n'

-- Example EXPLAIN template for profile directory query
\echo 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE)\n'
\echo 'SELECT p.id, p.full_name, p.country_code, p.verified, p.featured\n'
\echo 'FROM profiles p\n'
\echo 'WHERE p.role = ''guide'' AND p.deleted_at IS NULL\n'
\echo 'ORDER BY p.featured DESC, p.verified DESC, p.created_at DESC\n'
\echo 'LIMIT 50;\n'

-- Example EXPLAIN template for messaging query
\echo '\nExample for conversation loading:\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE)\n'
\echo 'SELECT m.id, m.content, m.sender_id, m.created_at\n'
\echo 'FROM messages m\n'
\echo 'WHERE m.conversation_id = ''<uuid>''\n'
\echo 'ORDER BY m.created_at DESC\n'
\echo 'LIMIT 50;\n'

-- Example EXPLAIN template for availability search
\echo '\nExample for availability search:\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE)\n'
\echo 'SELECT a.provider_id, a.date, a.start_time, a.end_time\n'
\echo 'FROM availability_slots a\n'
\echo 'WHERE a.provider_id = ''<uuid>''\n'
\echo '  AND a.date >= CURRENT_DATE\n'
\echo '  AND a.is_available = true\n'
\echo 'ORDER BY a.date, a.start_time;\n'

-- Example EXPLAIN template for review aggregation
\echo '\nExample for review aggregation:\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE)\n'
\echo 'SELECT reviewee_id,\n'
\echo '       COUNT(*) as review_count,\n'
\echo '       AVG(overall_rating) as avg_rating\n'
\echo 'FROM reviews\n'
\echo 'WHERE status = ''published''\n'
\echo 'GROUP BY reviewee_id;\n'

\echo '\n=== NEXT STEPS ===\n'
\echo '1. Identify the top 10 slowest queries from Section 9\n'
\echo '2. Run EXPLAIN (ANALYZE, BUFFERS) for each\n'
\echo '3. Look for:\n'
\echo '   - Seq Scan on large tables -> needs index\n'
\echo '   - High "Buffers: shared read" -> needs caching/index\n'
\echo '   - Nested Loop with high row estimates -> JOIN order issue\n'
\echo '   - Filter conditions removing many rows -> needs WHERE index\n'
\echo '4. Document findings in slow_queries.md\n'
\echo '5. Create index recommendations\n'

\timing off

-- ============================================================================
-- UTILITY: Reset pg_stat_statements (use with caution)
-- ============================================================================

-- Uncomment to reset statistics (useful after applying optimizations):
-- SELECT pg_stat_statements_reset();
