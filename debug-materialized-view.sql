-- Debug materialized view issue

-- Step 1: Check if the view definition exists
SELECT
    schemaname,
    matviewname,
    hasindexes,
    ispopulated
FROM pg_matviews
WHERE matviewname = 'guides_browse_v';

-- Step 2: Get the view definition
SELECT pg_get_viewdef('guides_browse_v'::regclass, true);

-- Step 3: Check if there's data in the underlying tables
SELECT
    'guides' as table_name,
    COUNT(*) as count
FROM guides
UNION ALL
SELECT
    'profiles (role=guide)' as table_name,
    COUNT(*) as count
FROM profiles
WHERE role = 'guide';

-- Step 4: Try to manually query what the view should contain
SELECT COUNT(*) as should_have
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id;

-- Step 5: Check current count in materialized view
SELECT COUNT(*) as current_count FROM guides_browse_v;

-- Step 6: Try a non-concurrent refresh
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 7: Check count again
SELECT COUNT(*) as count_after_refresh FROM guides_browse_v;
