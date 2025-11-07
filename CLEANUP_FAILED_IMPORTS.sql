-- ============================================================================
-- CLEANUP FAILED IMPORTS
-- ============================================================================
-- Run this to clean up orphaned auth users and partial profile data
-- from failed import attempts, then try importing again
-- ============================================================================

BEGIN;

-- Step 1: Find all auth users that were created but don't have complete profiles
-- These are from failed imports where auth user was created but profile insert failed

-- First, let's see what we're dealing with
SELECT
  'Orphaned auth users (auth created, no profile):' as info,
  COUNT(*) as count
FROM auth.users u
WHERE u.email LIKE '%@guidevalidator-staging.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- Step 2: Find profiles that exist but are incomplete
SELECT
  'Incomplete imported profiles:' as info,
  COUNT(*) as count
FROM public.profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- Step 3: Delete claim tokens for imported profiles
DELETE FROM public.profile_claim_tokens
WHERE profile_id IN (
  SELECT id FROM public.profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);

-- Step 4: Delete guide_credentials for imported profiles
DELETE FROM public.guide_credentials
WHERE guide_id IN (
  SELECT id FROM public.profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);

-- Step 5: Delete guides table entries for imported profiles
DELETE FROM public.guides
WHERE profile_id IN (
  SELECT id FROM public.profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);

-- Step 6: Delete profiles that were imported
DELETE FROM public.profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- Step 7: Delete orphaned auth users (auth users with staging emails but no profile)
-- IMPORTANT: This requires admin.deleteUser() in the API, so we'll log the IDs
SELECT
  'Orphaned auth user IDs to delete (use API route):' as info,
  u.id,
  u.email
FROM auth.users u
WHERE u.email LIKE '%@guidevalidator-staging.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ORDER BY u.created_at DESC;

-- Step 8: Clear staging_imports tracking
DELETE FROM public.staging_imports;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check cleanup was successful
SELECT 'Remaining imported profiles:' as check, COUNT(*) as count
FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging';

SELECT 'Remaining claim tokens:' as check, COUNT(*) as count
FROM public.profile_claim_tokens;

SELECT 'Remaining guide entries:' as check, COUNT(*) as count
FROM public.guides WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE application_data->>'imported_from' = 'guides_staging'
);

-- ============================================================================
-- AFTER RUNNING THIS
-- ============================================================================
--
-- 1. Note down the orphaned auth user IDs from Step 7
-- 2. Create an API route or use Supabase dashboard to delete those auth users
-- 3. Try the import again from /admin/import-guides
--
-- ============================================================================
