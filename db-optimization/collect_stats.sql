-- ============================================================================
-- Database Statistics Collection Script for Guide Validator
-- Purpose: Gather comprehensive metrics for optimization analysis
-- Platform: Supabase (Postgres 15)
-- ============================================================================

-- Enable timing for all queries
\timing on

-- ============================================================================
-- 1. SCHEMA INVENTORY & SIZE ANALYSIS
-- ============================================================================

-- All tables with row counts, sizes, and last activity
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio_pct,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 2. INDEX USAGE & DUPLICATES
-- ============================================================================

-- Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_scan = 0 THEN 'NEVER_USED'
        WHEN idx_scan < 10 THEN 'RARELY_USED'
        ELSE 'ACTIVE'
    END AS usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Find duplicate/redundant indexes
SELECT
    pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS total_size,
    (array_agg(idx))[1] AS idx1,
    (array_agg(idx))[2] AS idx2,
    (array_agg(idx))[3] AS idx3,
    (array_agg(idx))[4] AS idx4
FROM (
    SELECT
        indexrelid::regclass AS idx,
        (indrelid::text ||E'\n'|| indclass::text ||E'\n'|| indkey::text ||E'\n'||
         COALESCE(indexprs::text,'')||E'\n' || COALESCE(indpred::text,'')) AS key
    FROM pg_index
) sub
GROUP BY key
HAVING COUNT(*) > 1
ORDER BY SUM(pg_relation_size(idx)) DESC;

-- ============================================================================
-- 3. CONSTRAINT & FK ANALYSIS
-- ============================================================================

-- List all foreign keys
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Missing indexes on FK columns
SELECT
    c.conrelid::regclass AS table_name,
    a.attname AS column_name,
    'CREATE INDEX CONCURRENTLY idx_' || c.conrelid::regclass::text || '_' || a.attname ||
    ' ON ' || c.conrelid::regclass || '(' || a.attname || ');' AS suggested_index
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
    AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
        AND i.indkey[0] = a.attnum
    )
ORDER BY c.conrelid::regclass::text;

-- ============================================================================
-- 4. COLUMN ANALYSIS
-- ============================================================================

-- All columns with types and nullable status
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE
        WHEN data_type = 'character varying' AND character_maximum_length IS NULL THEN 'UNBOUNDED_VARCHAR'
        WHEN data_type IN ('text', 'character varying') AND column_name LIKE '%_id' THEN 'TEXT_FOR_ID'
        WHEN is_nullable = 'YES' AND column_name LIKE '%_id' THEN 'NULLABLE_FK'
        ELSE 'OK'
    END AS hygiene_flag
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Tables with nullable columns that should have NOT NULL
SELECT
    table_name,
    column_name,
    data_type,
    (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = c.table_name AND t.table_schema = 'public') as table_exists,
    'ALTER TABLE ' || table_name || ' ALTER COLUMN ' || column_name || ' SET NOT NULL;' AS suggestion
FROM information_schema.columns c
WHERE table_schema = 'public'
    AND is_nullable = 'YES'
    AND column_name IN ('id', 'created_at', 'user_id', 'profile_id')
    AND table_name NOT LIKE 'pg_%'
ORDER BY table_name, column_name;

-- ============================================================================
-- 5. BLOAT ESTIMATION
-- ============================================================================

-- Table bloat estimate
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct,
    CASE
        WHEN n_dead_tup > 10000 AND n_dead_tup::FLOAT / NULLIF(n_live_tup, 0) > 0.2 THEN 'VACUUM_FULL_RECOMMENDED'
        WHEN n_dead_tup > 1000 AND n_dead_tup::FLOAT / NULLIF(n_live_tup, 0) > 0.1 THEN 'VACUUM_RECOMMENDED'
        ELSE 'OK'
    END AS bloat_status
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC;

-- ============================================================================
-- 6. RLS POLICIES AUDIT
-- ============================================================================

-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Tables with RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 7. SLOW QUERIES (requires pg_stat_statements extension)
-- ============================================================================

-- Enable pg_stat_statements if not already enabled
-- Note: This requires superuser privileges
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 50 queries by total time
SELECT
    queryid,
    LEFT(query, 100) AS query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
    ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total,
    rows,
    ROUND((rows / NULLIF(calls, 0))::numeric, 2) AS rows_per_call
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
ORDER BY total_exec_time DESC
LIMIT 50;

-- Top queries by mean execution time
SELECT
    queryid,
    LEFT(query, 100) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_ms
FROM pg_stat_statements
WHERE calls > 10
    AND query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 50;

-- ============================================================================
-- 8. UNUSED/EMPTY TABLES
-- ============================================================================

SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    seq_scan + idx_scan AS total_scans,
    last_vacuum,
    last_autovacuum,
    CASE
        WHEN n_live_tup = 0 AND (seq_scan + idx_scan) < 10 THEN 'CANDIDATE_FOR_REMOVAL'
        WHEN n_live_tup = 0 THEN 'EMPTY_BUT_ACCESSED'
        WHEN (seq_scan + idx_scan) = 0 THEN 'NEVER_QUERIED'
        ELSE 'ACTIVE'
    END AS status
FROM pg_stat_user_tables
ORDER BY n_live_tup ASC, (seq_scan + idx_scan) ASC;

-- ============================================================================
-- 9. SEQUENCE ANALYSIS
-- ============================================================================

SELECT
    schemaname,
    sequencename,
    last_value,
    max_value,
    ROUND(100.0 * last_value / max_value, 2) AS pct_used
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY pct_used DESC;

-- ============================================================================
-- 10. MATERIALIZED VIEW CANDIDATES
-- ============================================================================

-- Expensive joins that are frequently accessed (manual inspection needed)
SELECT
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    ROUND(seq_tup_read::numeric / NULLIF(seq_scan, 0), 2) AS avg_seq_tup_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
    AND seq_tup_read / NULLIF(seq_scan, 0) > 1000
ORDER BY seq_tup_read DESC;

\timing off
