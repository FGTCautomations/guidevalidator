-- ================================================
-- COMPREHENSIVE FIX FOR ALL THREE ISSUES
-- ================================================

-- ISSUE 1: Check why materialized view won't populate
-- ================================================

-- 1.1: Check if view exists and is populated
SELECT
    matviewname,
    ispopulated,
    hasindexes
FROM pg_matviews
WHERE matviewname = 'guides_browse_v';

-- 1.2: Get count of underlying data
SELECT COUNT(*) as total_guides FROM guides;
SELECT COUNT(*) as total_guide_profiles FROM profiles WHERE role = 'guide';
SELECT COUNT(*) as joined_count FROM guides g INNER JOIN profiles p ON g.profile_id = p.id;

-- 1.3: Check for unique index (required for CONCURRENT refresh)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'guides_browse_v';

-- 1.4: Try regular refresh (not CONCURRENT)
REFRESH MATERIALIZED VIEW guides_browse_v;

-- 1.5: Check if it worked
SELECT COUNT(*) as count_after_refresh FROM guides_browse_v;

-- 1.6: Sample the data
SELECT
    profile_id,
    full_name,
    avatar_url,
    country_code,
    license_number
FROM guides_browse_v
LIMIT 5;


-- ISSUE 2 & 3: Verify avatar_url is populated
-- ================================================

-- 2.1: Check guides table for avatar_url
SELECT
    profile_id,
    avatar_url,
    license_number
FROM guides
WHERE avatar_url IS NOT NULL
LIMIT 5;

-- 2.2: Check how many guides have avatars
SELECT
    COUNT(*) as total_guides,
    COUNT(avatar_url) as guides_with_avatar,
    COUNT(*) - COUNT(avatar_url) as guides_without_avatar
FROM guides;

-- 2.3: Check profiles table for avatar_url
SELECT
    id,
    full_name,
    avatar_url,
    role
FROM profiles
WHERE role = 'guide' AND avatar_url IS NOT NULL
LIMIT 5;

-- 2.4: Sample of what admin panel should show
SELECT
    g.profile_id,
    p.full_name,
    p.avatar_url as profile_avatar,
    g.avatar_url as guide_avatar,
    COALESCE(p.avatar_url, g.avatar_url) as display_avatar,
    g.license_number
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
LIMIT 10;
