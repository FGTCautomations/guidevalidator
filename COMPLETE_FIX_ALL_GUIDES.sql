-- ================================================
-- COMPLETE FIX: Create profiles for ALL guides
-- ================================================

-- Step 1: How many guides have NO profile yet?
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile,
    COUNT(*) - COUNT(profile_id) as guides_WITHOUT_profile
FROM guides;

-- Step 2: Create profiles for ALL guides that don't have one
-- WARNING: This may take a while if you have 25,000+ guides
DO $$
DECLARE
  guide_record RECORD;
  new_profile_id uuid;
  batch_count int := 0;
BEGIN
  FOR guide_record IN
    SELECT id, name, card_number, province_issue
    FROM guides
    WHERE profile_id IS NULL
  LOOP
    -- Create a profile for this guide
    INSERT INTO profiles (
      full_name,
      country_code,
      role,
      application_status,
      verified,
      license_verified,
      created_at,
      updated_at
    ) VALUES (
      guide_record.name,
      'VN',
      'guide',
      'approved',  -- ✅ Set to APPROVED immediately
      true,        -- ✅ Mark as verified
      true,        -- ✅ Mark license as verified
      NOW(),
      NOW()
    )
    RETURNING id INTO new_profile_id;

    -- Link guide to profile
    UPDATE guides
    SET profile_id = new_profile_id,
        updated_at = NOW()
    WHERE id = guide_record.id;

    batch_count := batch_count + 1;

    -- Log progress every 1000 guides
    IF batch_count % 1000 = 0 THEN
      RAISE NOTICE 'Created % profiles so far...', batch_count;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ COMPLETE! Created % total profiles', batch_count;
END $$;

-- Step 3: Also approve any existing profiles that are still pending
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

-- Step 4: Verify all guides now have profiles
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile,
    COUNT(*) - COUNT(profile_id) as guides_still_missing_profile
FROM guides;

-- Step 5: Verify profiles are approved
SELECT
    p.application_status,
    COUNT(*) as count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status
ORDER BY count DESC;

-- Step 6: Test the materialized view query manually
SELECT COUNT(*) as manual_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');

-- Step 7: Refresh the materialized view
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 8: CHECK IF IT WORKED!
SELECT COUNT(*) as guides_in_directory FROM guides_browse_v;

-- Step 9: Sample the directory data
SELECT
    id,
    name,
    country_code,
    headline,
    verified,
    license_verified,
    languages
FROM guides_browse_v
LIMIT 10;

-- ================================================
-- SUCCESS CRITERIA
-- ================================================
-- Step 1: Should show ~0 guides WITHOUT profile
-- Step 4: Should show all guides have profiles
-- Step 5: Should show all as 'approved'
-- Step 6: Should show ~25,000
-- Step 8: Should show ~25,000 ✅
