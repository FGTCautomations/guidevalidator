-- ================================================
-- FIXED DIAGNOSTIC - Discover actual column names first
-- ================================================

-- Step 1: Check if materialized view exists
SELECT
    schemaname,
    matviewname,
    ispopulated,
    hasindexes
FROM pg_matviews
WHERE matviewname = 'guides_browse_v';

-- Step 2: Get the ACTUAL column names in the materialized view
SELECT
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'guides_browse_v'
ORDER BY ordinal_position;

-- Step 3: Get view definition to see how it's constructed
SELECT pg_get_viewdef('guides_browse_v'::regclass, true) as view_definition;

-- Step 4: Check underlying data counts
SELECT COUNT(*) as total_guides FROM guides;
SELECT COUNT(*) as total_guide_profiles FROM profiles WHERE role = 'guide';
SELECT COUNT(*) as joined_count FROM guides g INNER JOIN profiles p ON g.profile_id = p.id;

-- Step 5: Check for unique index (required for CONCURRENT refresh)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'guides_browse_v';

-- Step 6: Try regular refresh (not CONCURRENT)
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 7: Check count after refresh
SELECT COUNT(*) as count_after_refresh FROM guides_browse_v;

-- Step 8: Show first few rows (using * to get all columns)
SELECT * FROM guides_browse_v LIMIT 3;

-- Step 9: Check avatar data in source tables
SELECT
    COUNT(*) as total_guides,
    COUNT(avatar_url) as guides_with_avatar,
    COUNT(*) - COUNT(avatar_url) as guides_without_avatar
FROM guides;

-- Step 10: Sample join to see what admin panel gets
SELECT
    g.profile_id,
    p.full_name,
    p.avatar_url as profile_avatar,
    g.avatar_url as guide_avatar,
    COALESCE(p.avatar_url, g.avatar_url) as display_avatar,
    g.license_number,
    g.headline,
    p.country_code
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
LIMIT 10;
