-- ============================================================================
-- Schema Hygiene Checks for Guide Validator
-- Purpose: Identify schema issues without making changes (read-only)
-- Run this first to assess database health
-- ============================================================================

\timing on
\echo '\n=== SCHEMA HYGIENE REPORT ===\n'

-- ============================================================================
-- 1. MISSING NOT NULL CONSTRAINTS
-- ============================================================================
\echo '1. COLUMNS THAT SHOULD BE NOT NULL:\n'

SELECT
    table_name,
    column_name,
    data_type,
    'ALTER TABLE ' || table_name || ' ALTER COLUMN ' || column_name || ' SET NOT NULL;' AS fix_sql
FROM information_schema.columns
WHERE table_schema = 'public'
    AND is_nullable = 'YES'
    AND (
        column_name IN ('id', 'created_at', 'updated_at')
        OR (column_name LIKE '%_id' AND column_name NOT LIKE 'parent_%')
        OR column_name IN ('user_id', 'profile_id', 'guide_id', 'agency_id')
    )
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
ORDER BY table_name, column_name;

-- ============================================================================
-- 2. TEXT COLUMNS THAT SHOULD BE CONSTRAINED
-- ============================================================================
\echo '\n2. TEXT/VARCHAR WITHOUT CONSTRAINTS (Consider ENUMs or CHECK):\n'

SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    'Consider: CREATE TYPE ' || table_name || '_' || column_name || '_type AS ENUM (...);' AS suggestion
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type IN ('text', 'character varying')
    AND character_maximum_length IS NULL
    AND column_name IN ('status', 'role', 'type', 'state', 'gender', 'visibility', 'permission')
ORDER BY table_name, column_name;

-- ============================================================================
-- 3. COUNTRY CODE MISMATCHES (ISO3 vs ISO2)
-- ============================================================================
\echo '\n3. COUNTRY CODE COLUMN TYPES:\n'

SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    CASE
        WHEN character_maximum_length = 2 THEN 'ISO2 (CORRECT)'
        WHEN character_maximum_length = 3 THEN 'ISO3 (NEEDS FIX)'
        WHEN character_maximum_length IS NULL AND data_type IN ('text', 'character varying') THEN 'UNBOUNDED (BAD)'
        ELSE 'UNKNOWN'
    END AS assessment,
    CASE
        WHEN character_maximum_length != 2 THEN
            'ALTER TABLE ' || table_name || ' ALTER COLUMN ' || column_name || ' TYPE char(2);'
        ELSE NULL
    END AS fix_sql
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%country%code%'
ORDER BY table_name;

-- ============================================================================
-- 4. MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================
\echo '\n4. POTENTIAL MISSING FOREIGN KEYS (columns ending in _id):\n'

SELECT DISTINCT
    c.table_name,
    c.column_name,
    c.data_type,
    'Missing FK? Check if references ' ||
    REPLACE(REPLACE(c.column_name, '_id', ''), 'profile', 'profiles') || '.id' AS hint,
    'ALTER TABLE ' || c.table_name ||
    ' ADD CONSTRAINT fk_' || c.table_name || '_' || REPLACE(c.column_name, '_id', '') ||
    ' FOREIGN KEY (' || c.column_name || ') REFERENCES ' ||
    CASE
        WHEN c.column_name = 'profile_id' THEN 'profiles'
        WHEN c.column_name = 'user_id' THEN 'profiles'
        WHEN c.column_name = 'guide_id' THEN 'guides'
        WHEN c.column_name = 'agency_id' THEN 'agencies'
        WHEN c.column_name = 'conversation_id' THEN 'conversations'
        WHEN c.column_name = 'message_id' THEN 'messages'
        WHEN c.column_name = 'job_id' THEN 'jobs'
        WHEN c.column_name = 'reviewer_id' THEN 'profiles'
        WHEN c.column_name = 'reviewee_id' THEN 'profiles'
        ELSE REPLACE(c.column_name, '_id', 's')
    END || '(id);' AS suggested_fk
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.column_name LIKE '%_id'
    AND c.column_name != 'id'
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.table_name = c.table_name
            AND kcu.column_name = c.column_name
    )
ORDER BY c.table_name, c.column_name;

-- ============================================================================
-- 5. FOREIGN KEYS WITHOUT EXPLICIT DELETE BEHAVIOR
-- ============================================================================
\echo '\n5. FOREIGN KEYS WITHOUT EXPLICIT ON DELETE:\n'

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    rc.delete_rule,
    rc.update_rule,
    CASE
        WHEN rc.delete_rule = 'NO ACTION' THEN 'Consider: CASCADE, SET NULL, or RESTRICT'
        ELSE 'OK'
    END AS recommendation
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND rc.delete_rule = 'NO ACTION'
ORDER BY tc.table_name;

-- ============================================================================
-- 6. MISSING INDEXES ON FOREIGN KEY COLUMNS
-- ============================================================================
\echo '\n6. FOREIGN KEY COLUMNS WITHOUT INDEXES:\n'

SELECT
    c.conrelid::regclass AS table_name,
    a.attname AS column_name,
    c.confrelid::regclass AS referenced_table,
    'CREATE INDEX CONCURRENTLY idx_' || c.conrelid::regclass::text || '_' || a.attname ||
    ' ON ' || c.conrelid::regclass || '(' || a.attname || ');' AS create_index_sql
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
        AND i.indkey[0] = a.attnum  -- Index starts with this column
    )
ORDER BY c.conrelid::regclass::text, a.attname;

-- ============================================================================
-- 7. DUPLICATE/REDUNDANT INDEXES
-- ============================================================================
\echo '\n7. POTENTIALLY DUPLICATE INDEXES:\n'

SELECT
    pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS wasted_size,
    array_agg(idx ORDER BY idx::text) AS duplicate_indexes,
    COUNT(*) AS num_duplicates
FROM (
    SELECT
        indexrelid::regclass AS idx,
        (indrelid::text || '-' || indclass::text || '-' || indkey::text || '-' ||
         COALESCE(indexprs::text,'') || '-' || COALESCE(indpred::text,'')) AS key
    FROM pg_index
    WHERE indnamespace = 'public'::regnamespace
) sub
GROUP BY key
HAVING COUNT(*) > 1
ORDER BY SUM(pg_relation_size(idx)) DESC;

-- ============================================================================
-- 8. UNUSED INDEXES (never scanned)
-- ============================================================================
\echo '\n8. INDEXES THAT ARE NEVER USED:\n'

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS times_used,
    'DROP INDEX CONCURRENTLY ' || indexname || ';' AS drop_sql
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey'  -- Keep primary keys
    AND indexname NOT LIKE '%_key'   -- Keep unique constraints
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 9. TABLES WITH HIGH DEAD TUPLE RATIO
-- ============================================================================
\echo '\n9. TABLES NEEDING VACUUM:\n'

SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    CASE
        WHEN n_dead_tup > 10000 AND n_dead_tup::FLOAT / NULLIF(n_live_tup, 0) > 0.2 THEN 'VACUUM FULL'
        WHEN n_dead_tup > 1000 THEN 'VACUUM'
        ELSE 'OK'
    END AS recommendation,
    'VACUUM ANALYZE ' || schemaname || '.' || tablename || ';' AS vacuum_sql
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC
LIMIT 20;

-- ============================================================================
-- 10. COLUMNS STORING ENUMS AS TEXT
-- ============================================================================
\echo '\n10. TEXT COLUMNS WITH LIMITED DISTINCT VALUES (Consider ENUM):\n'

-- This requires dynamic SQL, so we provide the template
\echo 'Run this query for each table to find enum candidates:'
\echo 'SELECT column_name, data_type,'
\echo '       COUNT(DISTINCT column_value) as distinct_count,'
\echo '       COUNT(*) as total_rows'
\echo 'FROM (SELECT unnest(ARRAY[col1::text, col2::text, ...]) as column_value'
\echo '      FROM your_table) sub;'

-- ============================================================================
-- 11. JSONB COLUMNS THAT COULD BE NORMALIZED
-- ============================================================================
\echo '\n11. JSONB COLUMNS (Review for Normalization):\n'

SELECT
    table_name,
    column_name,
    'Review: Could ' || table_name || '.' || column_name || ' be normalized?' AS suggestion
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type IN ('jsonb', 'json')
ORDER BY table_name, column_name;

-- ============================================================================
-- 12. MISSING UNIQUE CONSTRAINTS
-- ============================================================================
\echo '\n12. CANDIDATE COLUMNS FOR UNIQUE CONSTRAINTS:\n'

SELECT
    table_name,
    column_name,
    data_type,
    'Consider: ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || table_name || '_' || column_name || '_unique UNIQUE (' || column_name || ');' AS suggestion
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('email', 'username', 'slug', 'stripe_customer_id', 'stripe_subscription_id')
    AND table_name NOT LIKE 'pg_%'
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
            AND tc.constraint_type = 'UNIQUE'
            AND kcu.table_name = information_schema.columns.table_name
            AND kcu.column_name = information_schema.columns.column_name
    )
ORDER BY table_name, column_name;

-- ============================================================================
-- 13. TABLES WITHOUT created_at OR updated_at
-- ============================================================================
\echo '\n13. TABLES MISSING AUDIT TIMESTAMPS:\n'

SELECT
    t.table_name,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns c
                        WHERE c.table_name = t.table_name
                        AND c.column_name = 'created_at') THEN 'Missing created_at'
        ELSE NULL
    END AS missing_created,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns c
                        WHERE c.table_name = t.table_name
                        AND c.column_name = 'updated_at') THEN 'Missing updated_at'
        ELSE NULL
    END AS missing_updated,
    'ALTER TABLE ' || t.table_name || ' ADD COLUMN created_at timestamptz DEFAULT now();' AS add_created_at,
    'ALTER TABLE ' || t.table_name || ' ADD COLUMN updated_at timestamptz DEFAULT now();' AS add_updated_at
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND (
        NOT EXISTS (SELECT 1 FROM information_schema.columns c
                   WHERE c.table_name = t.table_name AND c.column_name = 'created_at')
        OR NOT EXISTS (SELECT 1 FROM information_schema.columns c
                      WHERE c.table_name = t.table_name AND c.column_name = 'updated_at')
    )
ORDER BY t.table_name;

-- ============================================================================
-- 14. CHAR(N) VS VARCHAR(N) INCONSISTENCIES
-- ============================================================================
\echo '\n14. CHARACTER TYPE INCONSISTENCIES:\n'

SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    CASE
        WHEN data_type = 'character varying' AND character_maximum_length <= 10 THEN 'Consider char(' || character_maximum_length || ')'
        WHEN data_type = 'character' AND character_maximum_length > 10 THEN 'Consider varchar(' || character_maximum_length || ')'
        ELSE 'OK'
    END AS recommendation
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type IN ('character', 'character varying')
    AND character_maximum_length IS NOT NULL
    AND (
        (data_type = 'character varying' AND character_maximum_length <= 10)
        OR (data_type = 'character' AND character_maximum_length > 10)
    )
ORDER BY table_name, column_name;

\echo '\n=== END OF HYGIENE REPORT ===\n'
\timing off
