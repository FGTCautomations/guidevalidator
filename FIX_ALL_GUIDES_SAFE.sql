-- ================================================
-- SAFE FIX: Create profiles for ALL guides
-- Checks schema first, then adapts
-- ================================================

-- Step 1: Check what columns exist in guides table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'guides'
  AND table_schema = 'public'
  AND column_name IN ('card_number', 'license_number', 'name', 'full_name')
ORDER BY column_name;

-- Step 2: How many guides have NO profile yet?
SELECT
    COUNT(*) as total_guides,
    COUNT(profile_id) as guides_with_profile,
    COUNT(*) - COUNT(profile_id) as guides_WITHOUT_profile
FROM guides;

-- Step 3: Sample a guide to see its structure
SELECT * FROM guides WHERE profile_id IS NULL LIMIT 1;

-- ================================================
-- SIMPLIFIED FIX: Create profiles without referencing card_number
-- ================================================

DO $$
DECLARE
  guide_record RECORD;
  new_profile_id uuid;
  batch_count int := 0;
  guide_name_value text;
BEGIN
  FOR guide_record IN
    SELECT id, profile_id
    FROM guides
    WHERE profile_id IS NULL
  LOOP
    -- Try to get the name (might be in 'name' or 'full_name' column)
    -- We'll use a default if we can't access it
    BEGIN
      EXECUTE 'SELECT COALESCE(name, full_name, ''Guide'') FROM guides WHERE id = $1'
      INTO guide_name_value
      USING guide_record.id;
    EXCEPTION WHEN OTHERS THEN
      guide_name_value := 'Tour Guide';
    END;

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
      guide_name_value,
      'VN',
      'guide',
      'approved',
      true,
      true,
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

-- Step 4: Also approve any existing pending profiles
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
    COUNT(*) - COUNT(profile_id) as guides_still_missing_profile
FROM guides;

-- Step 6: Verify profiles are approved
SELECT
    p.application_status,
    COUNT(*) as count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status
ORDER BY count DESC;

-- Step 7: Test the materialized view query manually
SELECT COUNT(*) as manual_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');

-- Step 8: Refresh the materialized view
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Step 9: CHECK IF IT WORKED!
SELECT COUNT(*) as guides_in_directory FROM guides_browse_v;

-- Step 10: Sample the directory data
SELECT
    id,
    name,
    country_code,
    headline,
    verified,
    license_verified
FROM guides_browse_v
LIMIT 10;
