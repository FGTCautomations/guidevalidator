-- ================================================
-- DIAGNOSE WHY MATERIALIZED VIEW WON'T POPULATE
-- ================================================

-- Step 1: Check if the view definition is valid
SELECT pg_get_viewdef('guides_browse_v'::regclass, true) as view_definition;

-- Step 2: Check if underlying tables have data
SELECT 'guides' as table_name, COUNT(*) as count FROM guides
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'profiles (role=guide)' as table_name, COUNT(*) as count FROM profiles WHERE role = 'guide';

-- Step 3: Test if the underlying JOIN returns data
SELECT COUNT(*) as join_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id;

-- Step 4: Sample the actual join to see what's there
SELECT
    g.profile_id,
    p.id as profile_actual_id,
    p.full_name,
    p.role,
    g.license_number,
    g.headline
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
LIMIT 5;

-- Step 5: Check for orphaned guides (guides without matching profiles)
SELECT COUNT(*) as orphaned_guides
FROM guides g
LEFT JOIN profiles p ON g.profile_id = p.id
WHERE p.id IS NULL;

-- Step 6: Check for profile role mismatch
SELECT COUNT(*) as non_guide_profiles
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.role != 'guide';

-- Step 7: Check the exact materialized view definition
SELECT
    schemaname,
    matviewname,
    ispopulated,
    hasindexes,
    definition
FROM pg_matviews
WHERE matviewname = 'guides_browse_v';

-- Step 8: Try to manually run what the materialized view SHOULD execute
-- (We'll construct this based on Step 1's output)

-- Step 9: Check for any errors in postgres logs
-- (You'll need to check Supabase logs for this)

-- Step 10: Sample raw guides data to verify it's actually there
SELECT
    profile_id,
    license_number,
    headline,
    avatar_url,
    created_at
FROM guides
LIMIT 5;

-- Step 11: Sample raw profiles data for guides
SELECT
    id,
    full_name,
    role,
    avatar_url,
    country_code
FROM profiles
WHERE role = 'guide'
LIMIT 5;

-- Step 12: Check if there's a WHERE clause in the view that's filtering everything out
-- Look at the view definition from Step 1 and see if there's a restrictive WHERE clause
