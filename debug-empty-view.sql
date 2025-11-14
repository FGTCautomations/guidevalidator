-- ================================================
-- DEBUG: Why is materialized view still empty?
-- ================================================

-- Step 1: Did the UPDATE work? Check application_status now
SELECT
    p.application_status,
    COUNT(*) as count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status
ORDER BY count DESC;

-- Step 2: How many guides have profile_id?
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile_id,
    COUNT(*) - COUNT(profile_id) as guides_without_profile
FROM guides;

-- Step 3: Do those profile_ids actually exist in profiles table?
SELECT
    COUNT(DISTINCT g.profile_id) as unique_profile_ids_in_guides,
    COUNT(DISTINCT p.id) as matching_profiles_found
FROM guides g
LEFT JOIN profiles p ON g.profile_id = p.id;

-- Step 4: Sample guides and their profile match status
SELECT
    g.profile_id,
    CASE WHEN p.id IS NOT NULL THEN 'MATCHED' ELSE 'NO MATCH' END as match_status,
    p.full_name,
    p.role,
    p.application_status,
    g.license_number
FROM guides g
LEFT JOIN profiles p ON g.profile_id = p.id
LIMIT 10;

-- Step 5: Test the EXACT query that the materialized view uses
SELECT COUNT(*) as manual_query_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');

-- Step 6: Check if there are any approved guides at all
SELECT COUNT(*) as approved_guide_profiles
FROM profiles
WHERE role = 'guide' AND application_status = 'approved';

-- Step 7: Check the actual materialized view definition
SELECT pg_get_viewdef('guides_browse_v'::regclass, true) as view_definition;

-- Step 8: Check materialized view status
SELECT
    schemaname,
    matviewname,
    ispopulated,
    definition
FROM pg_matviews
WHERE matviewname = 'guides_browse_v';
