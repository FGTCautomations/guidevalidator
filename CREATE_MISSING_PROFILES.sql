-- ================================================
-- CREATE MISSING PROFILES - Ultra Simple Version
-- ================================================

-- Check how many need profiles
SELECT COUNT(*) as guides_without_profile
FROM guides
WHERE profile_id IS NULL;

-- Create profiles for ALL guides without one
DO $$
DECLARE
  guide_id_var uuid;
  new_profile_id uuid;
  counter int := 0;
BEGIN
  -- Loop through guides that don't have a profile
  FOR guide_id_var IN
    SELECT id FROM guides WHERE profile_id IS NULL
  LOOP
    -- Create a new profile
    INSERT INTO profiles (
      full_name,
      country_code,
      role,
      application_status,
      verified,
      license_verified
    ) VALUES (
      'Tour Guide',
      'VN',
      'guide',
      'approved',
      true,
      true
    )
    RETURNING id INTO new_profile_id;

    -- Link the guide to this profile
    UPDATE guides
    SET profile_id = new_profile_id
    WHERE id = guide_id_var;

    counter := counter + 1;

    -- Show progress
    IF counter % 1000 = 0 THEN
      RAISE NOTICE 'Created % profiles...', counter;
    END IF;
  END LOOP;

  RAISE NOTICE 'DONE! Created % profiles total', counter;
END $$;

-- Approve any existing profiles that are pending
UPDATE profiles
SET
    application_status = 'approved',
    verified = true,
    license_verified = true
WHERE role = 'guide'
  AND application_status != 'approved';

-- Verify
SELECT COUNT(*) as guides_with_profile
FROM guides
WHERE profile_id IS NOT NULL;

-- Check status
SELECT application_status, COUNT(*)
FROM profiles
WHERE role = 'guide'
GROUP BY application_status;

-- Refresh view
REFRESH MATERIALIZED VIEW guides_browse_v;

-- FINAL CHECK
SELECT COUNT(*) as directory_count FROM guides_browse_v;
