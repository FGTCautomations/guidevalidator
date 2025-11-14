-- ================================================
-- DEBUG ALL ISSUES
-- ================================================

-- Issue 1: Check agencies status
SELECT
    'Agencies' as table_name,
    application_status,
    verified,
    COUNT(*) as count
FROM agencies
GROUP BY application_status, verified
ORDER BY count DESC;

-- Issue 2: Check guides status
SELECT
    'Guides' as table_name,
    p.application_status,
    p.verified,
    COUNT(*) as count
FROM guides g
JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status, p.verified
ORDER BY count DESC;

-- Issue 3: Check profile roles distribution
SELECT
    role,
    application_status,
    COUNT(*) as count
FROM profiles
GROUP BY role, application_status
ORDER BY role, count DESC;

-- Issue 4: Check if agencies have the right fields for directory
SELECT
    COUNT(*) as total_agencies,
    COUNT(CASE WHEN application_status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified,
    COUNT(CASE WHEN country_code = 'VN' THEN 1 END) as vietnam,
    COUNT(CASE WHEN application_status = 'approved' AND verified = true THEN 1 END) as approved_and_verified
FROM agencies;

-- Issue 5: Check materialized views
SELECT
    schemaname,
    matviewname,
    ispopulated,
    hasindexes
FROM pg_matviews
WHERE matviewname LIKE '%agenc%' OR matviewname LIKE '%browse%'
ORDER BY matviewname;

-- Issue 6: Sample agencies to verify data
SELECT
    id,
    name,
    type,
    application_status,
    verified,
    country_code,
    contact_email
FROM agencies
LIMIT 5;

-- Issue 7: Sample guides to verify data
SELECT
    g.profile_id,
    p.full_name,
    p.role,
    p.application_status,
    p.verified,
    g.license_number
FROM guides g
JOIN profiles p ON g.profile_id = p.id
LIMIT 5;
