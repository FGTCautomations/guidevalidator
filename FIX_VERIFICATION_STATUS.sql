-- ================================================
-- FIX: Set imported guides as unverified until claimed
-- ================================================

-- Step 1: Check current verification status
SELECT
    verified,
    license_verified,
    COUNT(*) as count
FROM profiles
WHERE role = 'guide'
GROUP BY verified, license_verified;

-- Step 2: Update imported guides to unverified
-- Keep application_status='approved' so they show in directory
-- But set verified=false until they claim their profile
UPDATE profiles
SET
    verified = false,
    license_verified = false,
    updated_at = NOW()
WHERE role = 'guide'
  AND full_name = 'Tour Guide'  -- The generic name we used for imported guides
  AND verified = true;

-- Step 3: If you want to update ALL guide profiles (not just the generic ones)
-- Uncomment this to mark all as unverified:
/*
UPDATE profiles
SET
    verified = false,
    license_verified = false,
    updated_at = NOW()
WHERE role = 'guide'
  AND id NOT IN (
    -- Keep verified=true only for guides who have claimed (have auth user)
    SELECT DISTINCT p.id
    FROM profiles p
    INNER JOIN auth.users u ON u.id::text = p.id::text
    WHERE p.role = 'guide'
  );
*/

-- Step 4: Verify the update
SELECT
    verified,
    license_verified,
    COUNT(*) as count
FROM profiles
WHERE role = 'guide'
GROUP BY verified, license_verified;

-- Step 5: Check application_status is still approved (important!)
SELECT
    application_status,
    verified,
    COUNT(*) as count
FROM profiles
WHERE role = 'guide'
GROUP BY application_status, verified
ORDER BY count DESC;

-- Step 6: Refresh materialized view (should still show all guides)
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 7: Verify directory still has all guides
SELECT COUNT(*) as directory_count FROM guides_browse_v;

-- Step 8: Sample to see verification status in directory
SELECT
    id,
    name,
    verified,
    license_verified,
    country_code
FROM guides_browse_v
LIMIT 10;

-- ================================================
-- EXPECTED RESULTS:
-- ================================================
-- Step 4: Should show most guides with verified=false
-- Step 7: Should still show ~25,743 guides (they're approved, just not verified)
-- Step 8: Should show verified=false for unclaimed guides
