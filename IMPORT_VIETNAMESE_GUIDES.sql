-- ============================================================================
-- IMPORT VIETNAMESE GUIDES FROM STAGING TABLE
-- ============================================================================
-- This migration imports guides from public.guides_staging table into the
-- main profiles and guides tables with 'incomplete' status, allowing them
-- to claim their profiles using license number + email.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================================================

BEGIN;

-- Step 1: Verify guides_staging table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guides_staging'
  ) THEN
    RAISE EXCEPTION 'Table public.guides_staging does not exist. Please create it first.';
  END IF;
END $$;

-- Step 2: Show staging table structure for verification
SELECT
  'Staging table columns:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guides_staging'
ORDER BY ordinal_position;

-- Step 3: Create temporary email addresses for guides without emails
-- Using format: guide-{license_number}@guidevalidator-staging.com
-- These can be replaced when guides claim their profiles

-- Step 4: Insert profiles for each staging guide
INSERT INTO public.profiles (
  id,                          -- Generate new UUID
  role,                        -- Always 'guide'
  full_name,                   -- From staging.name
  email,                       -- Temporary staging email
  locale,                      -- Default 'en' or 'vi'
  country_code,                -- 'VN' for Vietnamese guides
  timezone,                    -- Default 'Asia/Ho_Chi_Minh'
  verified,                    -- false - needs verification
  license_verified,            -- false - needs verification
  application_status,          -- 'approved' - show in directory
  profile_completed,           -- false - needs completion
  profile_completion_percentage, -- Calculate based on available data
  required_fields_missing,     -- JSONB array of missing fields
  application_data,            -- Store staging data as JSONB
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  'guide' as role,
  COALESCE(TRIM(s.name), 'Guide') as full_name,
  -- Create temporary email from license number (will be replaced on claim)
  LOWER(CONCAT('guide-', REGEXP_REPLACE(COALESCE(s.card_number, gen_random_uuid()::text), '[^a-zA-Z0-9]', '', 'g'), '@guidevalidator-staging.com')) as email,
  'vi' as locale,  -- Vietnamese locale
  'VN' as country_code,
  'Asia/Ho_Chi_Minh' as timezone,
  false as verified,
  false as license_verified,
  'approved' as application_status,  -- Show in directory
  false as profile_completed,
  -- Calculate completion percentage based on available fields
  CASE
    WHEN s.name IS NOT NULL AND s.card_number IS NOT NULL THEN 30
    WHEN s.name IS NOT NULL THEN 20
    ELSE 10
  END as profile_completion_percentage,
  -- Track missing required fields
  jsonb_build_array(
    'email',           -- Real email needed
    'bio',             -- Biography
    'headline',        -- Professional headline
    'hourly_rate',     -- Rate information
    'experience_summary', -- Detailed experience
    'spoken_languages', -- Additional languages
    'specialties'      -- Tour specializations
  ) as required_fields_missing,
  -- Store all staging data in application_data for reference
  jsonb_build_object(
    'imported_from', 'guides_staging',
    'import_date', NOW(),
    'original_data', jsonb_build_object(
      'name', s.name,
      'country', s.country,
      'card_number', s.card_number,
      'expiry_date', s.expiry_date,
      'province_issue', s.province_issue,
      'card_type', s.card_type,
      'language', s.language,
      'experience', s.experience,
      'image_url', s.image_url,
      'source_url', s.source_url
    )
  ) as application_data,
  NOW() as created_at,
  NOW() as updated_at
FROM public.guides_staging s
WHERE s.card_number IS NOT NULL  -- Must have license number to be imported
ON CONFLICT (email) DO NOTHING;  -- Skip if staging email already exists

-- Step 5: Create guides table entries for imported profiles
INSERT INTO public.guides (
  profile_id,
  headline,
  bio,
  spoken_languages,
  years_experience,
  experience_summary,
  avatar_url,
  currency,
  created_at,
  updated_at
)
SELECT
  p.id as profile_id,
  -- Create basic headline from available data
  CASE
    WHEN s.card_type IS NOT NULL THEN CONCAT('Licensed ', s.card_type, ' Guide')
    ELSE 'Licensed Tour Guide'
  END as headline,
  -- Basic bio from experience if available
  COALESCE(s.experience, 'Professional tour guide in Vietnam. Profile completion pending.') as bio,
  -- Parse language field to array
  CASE
    WHEN s.language IS NOT NULL THEN
      ARRAY(SELECT LOWER(TRIM(unnest(string_to_array(s.language, ',')))))
    ELSE ARRAY['vi']::text[]
  END as spoken_languages,
  -- Extract years from experience if it's a number
  CASE
    WHEN s.experience ~ '^[0-9]+$' THEN s.experience::integer
    ELSE NULL
  END as years_experience,
  s.experience as experience_summary,
  s.image_url as avatar_url,
  'VND' as currency,  -- Vietnamese Dong
  NOW() as created_at,
  NOW() as updated_at
FROM public.profiles p
INNER JOIN public.guides_staging s ON (
  p.application_data->>'imported_from' = 'guides_staging'
  AND p.application_data->'original_data'->>'card_number' = s.card_number
)
WHERE p.role = 'guide'
  AND NOT EXISTS (
    SELECT 1 FROM public.guides g WHERE g.profile_id = p.id
  )
ON CONFLICT (profile_id) DO NOTHING;

-- Step 6: Create guide_credentials entries for license information
INSERT INTO public.guide_credentials (
  id,
  guide_id,
  credential_type,
  country_code,
  authority_name,
  license_number,
  issued_at,
  expires_at,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  p.id as guide_id,
  COALESCE(s.card_type, 'license') as credential_type,
  'VN' as country_code,
  COALESCE(s.province_issue, 'Vietnam Tourism Authority') as authority_name,
  s.card_number as license_number,
  NULL as issued_at,  -- Not provided in staging
  -- Parse expiry_date if available
  CASE
    WHEN s.expiry_date IS NOT NULL THEN
      CASE
        WHEN s.expiry_date ~ '^\d{4}-\d{2}-\d{2}$' THEN s.expiry_date::date
        ELSE NULL
      END
    ELSE NULL
  END as expires_at,
  'pending' as status,  -- Needs verification
  NOW() as created_at,
  NOW() as updated_at
FROM public.profiles p
INNER JOIN public.guides_staging s ON (
  p.application_data->>'imported_from' = 'guides_staging'
  AND p.application_data->'original_data'->>'card_number' = s.card_number
)
WHERE p.role = 'guide'
  AND s.card_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.guide_credentials gc
    WHERE gc.guide_id = p.id AND gc.license_number = s.card_number
  );

-- Step 7: Create profile completion tokens for claiming profiles
-- This table stores secure tokens that guides can use to claim their profiles
CREATE TABLE IF NOT EXISTS public.profile_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_token ON public.profile_claim_tokens(token);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_license ON public.profile_claim_tokens(license_number);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_profile ON public.profile_claim_tokens(profile_id);

-- Step 8: Generate claim tokens for all imported guides
INSERT INTO public.profile_claim_tokens (
  profile_id,
  license_number,
  token,
  expires_at
)
SELECT
  p.id as profile_id,
  s.card_number as license_number,
  -- Generate secure random token (base64-encoded random bytes)
  encode(gen_random_bytes(32), 'base64') as token,
  NOW() + INTERVAL '90 days' as expires_at
FROM public.profiles p
INNER JOIN public.guides_staging s ON (
  p.application_data->>'imported_from' = 'guides_staging'
  AND p.application_data->'original_data'->>'card_number' = s.card_number
)
WHERE p.role = 'guide'
  AND s.card_number IS NOT NULL
ON CONFLICT (token) DO NOTHING;

-- Step 9: Create RLS policies for claim tokens
ALTER TABLE public.profile_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can verify a token exists (for claim validation)
DROP POLICY IF EXISTS "profile_claim_tokens_select" ON public.profile_claim_tokens;
CREATE POLICY "profile_claim_tokens_select" ON public.profile_claim_tokens
  FOR SELECT
  USING (
    expires_at > NOW()
    AND claimed_at IS NULL
  );

-- Only admins can insert/update/delete tokens
DROP POLICY IF EXISTS "profile_claim_tokens_admin_all" ON public.profile_claim_tokens;
CREATE POLICY "profile_claim_tokens_admin_all" ON public.profile_claim_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Step 10: Show import summary
SELECT
  'Import Summary' as report,
  (SELECT COUNT(*) FROM public.guides_staging WHERE card_number IS NOT NULL) as total_staging_guides,
  (SELECT COUNT(*) FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging') as imported_profiles,
  (SELECT COUNT(*) FROM public.guides WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging'
  )) as imported_guides,
  (SELECT COUNT(*) FROM public.guide_credentials WHERE guide_id IN (
    SELECT id FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging'
  )) as imported_credentials,
  (SELECT COUNT(*) FROM public.profile_claim_tokens WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging'
  )) as generated_claim_tokens;

-- Step 11: Export claim links for invitation emails
-- Copy this output and use it to send invitation emails to guides
SELECT
  p.full_name as guide_name,
  gc.license_number,
  pct.token as claim_token,
  CONCAT('https://guidevalidator.com/claim-profile/', pct.token) as claim_link,
  s.source_url as original_profile_url,
  p.application_data->'original_data'->>'language' as languages,
  pct.expires_at::date as link_expires
FROM public.profile_claim_tokens pct
INNER JOIN public.profiles p ON pct.profile_id = p.id
INNER JOIN public.guide_credentials gc ON gc.guide_id = p.id AND gc.license_number = pct.license_number
INNER JOIN public.guides_staging s ON s.card_number = pct.license_number
WHERE p.application_data->>'imported_from' = 'guides_staging'
  AND pct.claimed_at IS NULL
  AND pct.expires_at > NOW()
ORDER BY p.full_name;

COMMIT;

-- ============================================================================
-- POST-IMPORT INSTRUCTIONS
-- ============================================================================
--
-- 1. VERIFICATION:
--    - Check the import summary to ensure all guides were imported
--    - Verify claim tokens were generated for all guides
--
-- 2. INVITATION EMAILS:
--    - Use the export query above to get claim links for each guide
--    - Send personalized emails to guides with their claim links
--    - Include their license number for verification
--
-- 3. CLAIM PROCESS:
--    - Guides visit: https://guidevalidator.com/claim-profile/{token}
--    - They verify their identity with license number
--    - They create account (email + password)
--    - They complete their profile
--
-- 4. DIRECTORY DISPLAY:
--    - Imported guides appear in directory with "Incomplete Profile" badge
--    - Once claimed and completed, badge is removed
--
-- 5. CLEANUP (after 90 days):
--    - Unclaimed profiles can be archived or deleted
--    - Run: DELETE FROM profiles WHERE application_data->>'imported_from' = 'guides_staging'
--           AND profile_completed = false AND created_at < NOW() - INTERVAL '90 days';
--
-- ============================================================================
