-- =====================================================
-- SETUP IMPORTED GUIDES FOR DIRECTORY DISPLAY
-- =====================================================

-- Step 1: Create profile_claim_tokens table if not exists
CREATE TABLE IF NOT EXISTS profile_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Indexes for profile_claim_tokens
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_token ON profile_claim_tokens(token);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_license ON profile_claim_tokens(license_number);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_profile ON profile_claim_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_claimed ON profile_claim_tokens(claimed_at) WHERE claimed_at IS NULL;

-- Step 2: Map CSV columns to expected columns
-- Convert "language" (CSV comma-separated string) to "spoken_languages" (text array)
UPDATE guides
SET spoken_languages = string_to_array(
  LOWER(TRIM(BOTH '"' FROM language)),
  ','
)
WHERE language IS NOT NULL
  AND spoken_languages IS NULL;

-- Step 3: Set default values for required fields
UPDATE guides
SET
  headline = CASE
    WHEN headline IS NULL THEN
      CASE
        WHEN experience IS NOT NULL THEN 'Licensed Tour Guide - ' || experience
        ELSE 'Licensed Tour Guide'
      END
    ELSE headline
  END,
  currency = COALESCE(currency, 'USD'),
  has_liability_insurance = COALESCE(has_liability_insurance, false),
  specialties = COALESCE(specialties, ARRAY[]::text[])
WHERE profile_id IS NULL; -- Only update imported guides

-- Step 4: Add default specialties based on experience
UPDATE guides
SET specialties = CASE
  WHEN experience LIKE '%10%' OR experience LIKE '%Year%' THEN
    ARRAY['cultural-tours', 'historical-sites']
  ELSE
    ARRAY['cultural-tours']
END
WHERE profile_id IS NULL
  AND (specialties IS NULL OR specialties = ARRAY[]::text[]);

-- Step 5: Create staging profiles for imported guides (if they don't have profile_id)
DO $$
DECLARE
  guide_record RECORD;
  new_profile_id uuid;
BEGIN
  FOR guide_record IN
    SELECT id, name, card_number, province_issue
    FROM guides
    WHERE profile_id IS NULL
    LIMIT 1000
  LOOP
    -- Create a staging profile
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
      'VN', -- Vietnam
      'guide',
      'pending', -- Pending until claimed
      false,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_profile_id;

    -- Update guide with new profile_id
    UPDATE guides
    SET profile_id = new_profile_id
    WHERE id = guide_record.id;

  END LOOP;
END $$;

-- Step 6: Generate claim tokens for all imported guides
INSERT INTO profile_claim_tokens (profile_id, license_number, token, expires_at)
SELECT
  g.profile_id,
  g.card_number,
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '1 year'
FROM guides g
WHERE g.card_number IS NOT NULL
  AND g.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profile_claim_tokens pct
    WHERE pct.license_number = g.card_number
  );

-- Step 7: Refresh materialized view to include new guides
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- Step 8: Verify the setup
SELECT
  COUNT(*) as total_guides,
  COUNT(DISTINCT profile_id) as guides_with_profiles,
  COUNT(DISTINCT CASE WHEN spoken_languages IS NOT NULL THEN id END) as guides_with_languages,
  COUNT(DISTINCT CASE WHEN specialties IS NOT NULL AND array_length(specialties, 1) > 0 THEN id END) as guides_with_specialties
FROM guides;

-- Step 9: Show claim token summary
SELECT
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN claimed_at IS NULL THEN 1 END) as unclaimed,
  COUNT(CASE WHEN claimed_at IS NOT NULL THEN 1 END) as claimed
FROM profile_claim_tokens;
