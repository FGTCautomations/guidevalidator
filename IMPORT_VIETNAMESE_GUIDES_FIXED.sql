-- ============================================================================
-- IMPORT VIETNAMESE GUIDES FROM STAGING TABLE (FIXED VERSION)
-- ============================================================================
-- This migration imports guides from public.guides_staging table into the
-- main profiles and guides tables with 'incomplete' status, allowing them
-- to claim their profiles using license number.
--
-- IMPORTANT: This script uses a serverless function approach since direct
-- auth.users manipulation requires service role key.
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

-- Step 3: Create a staging_imports tracking table
CREATE TABLE IF NOT EXISTS public.staging_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_license_number text NOT NULL,
  profile_id uuid,
  auth_user_id uuid,
  temporary_email text,
  import_status text DEFAULT 'pending', -- 'pending', 'imported', 'failed'
  error_message text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_imports_license ON public.staging_imports(staging_license_number);

-- Step 4: Insert placeholder records for tracking (without creating auth users yet)
-- We'll store the data and provide it for manual import via API
INSERT INTO public.staging_imports (
  staging_license_number,
  temporary_email,
  import_status
)
SELECT
  s.card_number as staging_license_number,
  LOWER(CONCAT('guide-', REGEXP_REPLACE(s.card_number, '[^a-zA-Z0-9]', '', 'g'), '@guidevalidator-staging.com')) as temporary_email,
  'pending' as import_status
FROM public.guides_staging s
WHERE s.card_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 5: Create profile completion tokens table for claiming profiles
CREATE TABLE IF NOT EXISTS public.profile_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create indexes for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_token ON public.profile_claim_tokens(token);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_license ON public.profile_claim_tokens(license_number);
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_profile ON public.profile_claim_tokens(profile_id);

-- Step 6: Create RLS policies for claim tokens
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

-- Enable RLS on staging_imports
ALTER TABLE public.staging_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staging_imports_admin_all" ON public.staging_imports;
CREATE POLICY "staging_imports_admin_all" ON public.staging_imports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

COMMIT;

-- ============================================================================
-- IMPORTANT NEXT STEPS
-- ============================================================================
--
-- Since direct auth.users creation requires service role key, you need to
-- use the admin API endpoint to complete the import.
--
-- OPTION 1: Use the Admin Bulk Import API (Recommended)
-- -------------------------------------------------------
-- Navigate to: /admin/bulk-upload
-- Upload your guides_staging data as CSV
-- The system will automatically create auth users and profiles
--
-- OPTION 2: Manual API Import (For Developers)
-- ---------------------------------------------
-- Create an API route that uses Supabase Service Role client:
--
-- POST /api/admin/import-staging-guides
--
-- This route should:
-- 1. Read from guides_staging table
-- 2. For each guide:
--    - Create auth user with temporary email
--    - Create profile with application_data
--    - Create guides table entry
--    - Create guide_credentials entry
--    - Generate claim token
--
-- See: /app/api/admin/import-staging-guides/route.ts (create this file)
--
-- ============================================================================

-- Query to see staging data ready for import
SELECT
  s.card_number as license_number,
  s.name as guide_name,
  s.country,
  s.card_type,
  s.language as languages,
  s.experience,
  s.province_issue as issuing_authority,
  s.expiry_date as license_expiry,
  s.image_url,
  s.source_url,
  si.temporary_email,
  si.import_status
FROM public.guides_staging s
LEFT JOIN public.staging_imports si ON si.staging_license_number = s.card_number
WHERE s.card_number IS NOT NULL
ORDER BY s.name;
