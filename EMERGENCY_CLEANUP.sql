-- ============================================================================
-- EMERGENCY CLEANUP - Run this in Supabase SQL Editor NOW
-- ============================================================================
-- This will forcefully delete ALL staging data
-- ============================================================================

BEGIN;

-- Get all staging user IDs from auth.users
CREATE TEMP TABLE staging_ids AS
SELECT id, email FROM auth.users
WHERE email LIKE '%@guidevalidator-staging.com';

-- Show what we found
SELECT 'Staging auth users found:' as info, COUNT(*) as count FROM staging_ids;

-- Delete claim tokens
DELETE FROM public.profile_claim_tokens
WHERE profile_id IN (SELECT id FROM staging_ids);

-- Delete credentials
DELETE FROM public.guide_credentials
WHERE guide_id IN (SELECT id FROM staging_ids);

-- Delete guides
DELETE FROM public.guides
WHERE profile_id IN (SELECT id FROM staging_ids);

-- Delete profiles
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM staging_ids);

-- Show remaining (should be 0)
SELECT 'Remaining profiles:' as check, COUNT(*) FROM public.profiles WHERE id IN (SELECT id FROM staging_ids);
SELECT 'Remaining guides:' as check, COUNT(*) FROM public.guides WHERE profile_id IN (SELECT id FROM staging_ids);

-- Clear staging imports
DELETE FROM public.staging_imports;

COMMIT;

-- ============================================================================
-- NOW DELETE AUTH USERS MANUALLY
-- ============================================================================
-- Supabase doesn't allow SQL deletion of auth.users
-- You MUST do this via the API or Dashboard:
--
-- OPTION 1: Use Supabase Dashboard (5 minutes)
-- 1. Go to: Authentication > Users
-- 2. Search for: "@guidevalidator-staging.com"
-- 3. Select all users (checkbox at top)
-- 4. Click bulk delete
--
-- OPTION 2: Use this SQL to get the count and verify
SELECT
  'Auth users that need manual deletion:' as instruction,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@guidevalidator-staging.com';

-- Show first 10 for verification
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@guidevalidator-staging.com'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
