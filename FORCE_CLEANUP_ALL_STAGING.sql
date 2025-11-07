-- ============================================================================
-- FORCE CLEANUP ALL STAGING DATA
-- ============================================================================
-- This is a more aggressive cleanup that removes ALL data associated with
-- staging email addresses (@guidevalidator-staging.com)
-- ============================================================================

BEGIN;

-- Step 1: Find all profiles with staging email pattern in auth.users
CREATE TEMP TABLE staging_profile_ids AS
SELECT DISTINCT u.id
FROM auth.users u
WHERE u.email LIKE '%@guidevalidator-staging.com';

SELECT 'Found staging profiles:' as info, COUNT(*) as count FROM staging_profile_ids;

-- Step 2: Delete claim tokens for staging profiles
DELETE FROM public.profile_claim_tokens
WHERE profile_id IN (SELECT id FROM staging_profile_ids);

-- Step 3: Delete guide_credentials for staging profiles
DELETE FROM public.guide_credentials
WHERE guide_id IN (SELECT id FROM staging_profile_ids);

-- Step 4: Delete guides for staging profiles
DELETE FROM public.guides
WHERE profile_id IN (SELECT id FROM staging_profile_ids);

-- Step 5: Delete profiles for staging users
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM staging_profile_ids);

-- Step 6: Delete auth users with staging emails
-- Note: This will cascade delete anything else linked to these users
SELECT
  'Auth users to delete:' as info,
  id,
  email,
  created_at
FROM auth.users
WHERE email LIKE '%@guidevalidator-staging.com'
ORDER BY created_at DESC;

-- WARNING: Uncomment the line below to actually delete auth users
-- You may need to do this manually from Supabase Dashboard > Authentication > Users
-- Or use the cleanup API route

-- Step 7: Clear staging_imports
DELETE FROM public.staging_imports;

-- Step 8: Verification
SELECT 'Remaining profiles with staging data:' as check, COUNT(*) as count
FROM public.profiles
WHERE id IN (SELECT id FROM staging_profile_ids);

SELECT 'Remaining guides with staging data:' as check, COUNT(*) as count
FROM public.guides
WHERE profile_id IN (SELECT id FROM staging_profile_ids);

SELECT 'Remaining claim tokens:' as check, COUNT(*) as count
FROM public.profile_claim_tokens
WHERE profile_id IN (SELECT id FROM staging_profile_ids);

COMMIT;

-- ============================================================================
-- MANUAL AUTH USER DELETION
-- ============================================================================
-- If auth users still exist after running this script, you need to delete them
-- manually. Here's a query to get their IDs:

SELECT
  'Copy these IDs and delete via Supabase Dashboard:' as instruction,
  id,
  email
FROM auth.users
WHERE email LIKE '%@guidevalidator-staging.com';

-- To delete via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Search for "@guidevalidator-staging.com"
-- 3. Click each user and delete
--
-- OR use the cleanup API route which will handle this automatically
-- ============================================================================
