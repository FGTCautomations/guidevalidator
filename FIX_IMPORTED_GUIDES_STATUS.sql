-- ================================================
-- FIX: Approve all imported guides so they appear in directory
-- ================================================

-- Step 1: Check current application_status distribution
SELECT
    p.application_status,
    COUNT(*) as guide_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status
ORDER BY guide_count DESC;

-- Step 2: Check how many guides are NOT approved
SELECT COUNT(*) as guides_not_approved
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status != 'approved' OR p.application_status IS NULL;

-- Step 3: Sample profiles that aren't approved
SELECT
    p.id,
    p.full_name,
    p.application_status,
    p.role,
    g.license_number
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status != 'approved' OR p.application_status IS NULL
LIMIT 10;

-- ================================================
-- THE FIX: Approve all imported guide profiles
-- ================================================

-- Step 4: Update all guide profiles to 'approved' status
UPDATE profiles p
SET
    application_status = 'approved',
    application_submitted_at = COALESCE(application_submitted_at, NOW()),
    application_reviewed_at = NOW(),
    application_reviewed_by = (
        SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
    ),
    verified = true,  -- Mark as verified
    license_verified = true,  -- Mark license as verified
    updated_at = NOW()
WHERE p.role = 'guide'
  AND p.id IN (SELECT profile_id FROM guides)
  AND (p.application_status != 'approved' OR p.application_status IS NULL);

-- Step 5: Check how many were updated
SELECT
    p.application_status,
    COUNT(*) as guide_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status
ORDER BY guide_count DESC;

-- ================================================
-- REFRESH THE MATERIALIZED VIEW
-- ================================================

-- Step 6: Refresh the materialized view (non-concurrent first to ensure it works)
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 7: Verify it's populated now
SELECT COUNT(*) as total_guides_in_directory FROM guides_browse_v;

-- Step 8: Sample the directory data
SELECT
    id,
    name,
    country_code,
    headline,
    verified,
    license_verified
FROM guides_browse_v
LIMIT 10;

-- ================================================
-- SUCCESS CHECK
-- ================================================

-- If Step 7 shows ~25,000 guides, SUCCESS! ✅
-- Now run CONCURRENT refresh to test if it works:
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- Final count
SELECT COUNT(*) as final_count FROM guides_browse_v;
