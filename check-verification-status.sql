-- Quick check: Did the update work?

-- Check profiles table directly
SELECT
    verified,
    license_verified,
    COUNT(*) as count
FROM profiles
WHERE role = 'guide'
GROUP BY verified, license_verified;

-- Check what the admin panel query sees
SELECT
    p.verified,
    p.license_verified,
    COUNT(*) as count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.verified, p.license_verified;

-- Check what the materialized view has
SELECT
    verified,
    license_verified,
    COUNT(*) as count
FROM guides_browse_v
GROUP BY verified, license_verified;

-- Sample 5 guides from each source
SELECT 'profiles' as source, id, full_name, verified, license_verified
FROM profiles
WHERE role = 'guide'
LIMIT 5

UNION ALL

SELECT 'view' as source, id::uuid, name, verified, license_verified
FROM guides_browse_v
LIMIT 5;
