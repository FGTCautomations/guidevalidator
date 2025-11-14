-- ================================================
-- SIMPLE FIX: Create profiles for ALL guides
-- Uses only ID and profile_id (guaranteed to exist)
-- ================================================

-- Step 1: How many guides need profiles?
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile,
    COUNT(*) - COUNT(profile_id) as guides_WITHOUT_profile
FROM guides;

-- Step 2: Create profiles for guides that don't have one
INSERT INTO profiles (
  full_name,
  country_code,
  role,
  application_status,
  verified,
  license_verified,
  created_at,
  updated_at
)
SELECT
  'Vietnamese Tour Guide',  -- Generic name for now
  'VN',
  'guide',
  'approved',
  true,
  true,
  NOW(),
  NOW()
FROM guides
WHERE profile_id IS NULL;

-- Step 3: Get the profile IDs we just created
-- Update guides with their new profile_ids
WITH new_profiles AS (
  SELECT id as profile_id
  FROM profiles
  WHERE full_name = 'Vietnamese Tour Guide'
    AND role = 'guide'
    AND created_at >= NOW() - INTERVAL '1 minute'
),
guides_without_profiles AS (
  SELECT id as guide_id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM guides
  WHERE profile_id IS NULL
),
profiles_with_rn AS (
  SELECT profile_id, ROW_NUMBER() OVER (ORDER BY profile_id) as rn
  FROM new_profiles
)
UPDATE guides g
SET profile_id = p.profile_id,
    updated_at = NOW()
FROM guides_without_profiles gwp
JOIN profiles_with_rn p ON gwp.rn = p.rn
WHERE g.id = gwp.guide_id;

-- Step 4: Approve any existing pending profiles
UPDATE profiles p
SET
    application_status = 'approved',
    verified = true,
    license_verified = true,
    application_submitted_at = COALESCE(application_submitted_at, NOW()),
    application_reviewed_at = NOW(),
    updated_at = NOW()
WHERE p.role = 'guide'
  AND p.id IN (SELECT profile_id FROM guides WHERE profile_id IS NOT NULL)
  AND p.application_status != 'approved';

-- Step 5: Verify all guides now have profiles
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile,
    COUNT(*) - COUNT(profile_id) as still_missing
FROM guides;

-- Step 6: Check application status
SELECT
    p.application_status,
    COUNT(*) as count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status;

-- Step 7: Test the view query manually
SELECT COUNT(*) as should_appear_in_view
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');

-- Step 8: Refresh materialized view
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 9: VERIFY IT WORKED
SELECT COUNT(*) as guides_in_directory FROM guides_browse_v;

-- Step 10: Sample data
SELECT id, name, country_code, headline
FROM guides_browse_v
LIMIT 5;
