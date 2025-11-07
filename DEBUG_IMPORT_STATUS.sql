-- ============================================================================
-- DEBUG IMPORT STATUS
-- ============================================================================
-- Run these queries to understand what's happening with your import
-- ============================================================================

-- 1. Check how many guides are in staging
SELECT
  'Total guides in staging:' as info,
  COUNT(*) as count
FROM public.guides_staging
WHERE card_number IS NOT NULL;

-- 2. List all guides in staging
SELECT
  name as guide_name,
  card_number as license_number,
  country,
  language,
  experience
FROM public.guides_staging
WHERE card_number IS NOT NULL
ORDER BY name;

-- 3. Check how many have already been imported
SELECT
  'Already imported profiles:' as info,
  COUNT(*) as count
FROM public.profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- 4. List imported profiles
SELECT
  id,
  full_name,
  application_data->'original_data'->>'card_number' as license_number,
  profile_completion_percentage,
  created_at
FROM public.profiles
WHERE application_data->>'imported_from' = 'guides_staging'
ORDER BY created_at DESC;

-- 5. Check for duplicate license numbers in staging
SELECT
  card_number,
  COUNT(*) as duplicate_count
FROM public.guides_staging
WHERE card_number IS NOT NULL
GROUP BY card_number
HAVING COUNT(*) > 1;

-- 6. Check claim tokens
SELECT
  'Claim tokens generated:' as info,
  COUNT(*) as count
FROM public.profile_claim_tokens;

-- 7. List all claim tokens with guide info
SELECT
  pct.id,
  pct.license_number,
  pct.token,
  pct.expires_at,
  pct.claimed_at,
  p.full_name as guide_name,
  p.profile_completion_percentage
FROM public.profile_claim_tokens pct
LEFT JOIN public.profiles p ON p.id = pct.profile_id
ORDER BY pct.created_at DESC;

-- 8. Check if any auth users were created
SELECT
  'Total auth users:' as info,
  COUNT(*) as count
FROM auth.users;

-- 9. Check guides table entries
SELECT
  'Guides table entries:' as info,
  COUNT(*) as count
FROM public.guides
WHERE profile_id IN (
  SELECT id FROM public.profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);

-- 10. Check guide_credentials entries
SELECT
  'Guide credentials entries:' as info,
  COUNT(*) as count
FROM public.guide_credentials
WHERE guide_id IN (
  SELECT id FROM public.profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);

-- ============================================================================
-- DIAGNOSTIC CHECKLIST
-- ============================================================================
--
-- Run all queries above and check:
--
-- 1. Total guides in staging should match your CSV import count
-- 2. Already imported profiles - if this equals total staging, all were skipped
-- 3. Duplicate license numbers - might cause import issues
-- 4. Claim tokens - should equal number of imported profiles
-- 5. Auth users - verify new users were created
-- 6. Guides table - should have entries for each imported profile
-- 7. Guide credentials - should have entries for each imported profile
--
-- If you see:
-- - High "already imported" count: Run DELETE queries below to reset
-- - Zero claim tokens but profiles exist: Check RLS policies
-- - Zero guides table entries: Check for errors in import logs
--
-- ============================================================================

-- RESET IMPORT (USE WITH CAUTION!)
-- ============================================================================
-- Only run these if you want to delete all imported guides and start over
-- ============================================================================

-- Uncomment and run these ONE AT A TIME if you need to reset:

-- DELETE FROM public.profile_claim_tokens
-- WHERE profile_id IN (
--   SELECT id FROM public.profiles
--   WHERE application_data->>'imported_from' = 'guides_staging'
-- );

-- DELETE FROM public.guide_credentials
-- WHERE guide_id IN (
--   SELECT id FROM public.profiles
--   WHERE application_data->>'imported_from' = 'guides_staging'
-- );

-- DELETE FROM public.guides
-- WHERE profile_id IN (
--   SELECT id FROM public.profiles
--   WHERE application_data->>'imported_from' = 'guides_staging'
-- );

-- -- Get auth user IDs to delete
-- SELECT id FROM public.profiles
-- WHERE application_data->>'imported_from' = 'guides_staging';

-- -- Manually delete auth users using Supabase dashboard or:
-- -- DELETE FROM auth.users WHERE id IN (...);

-- DELETE FROM public.profiles
-- WHERE application_data->>'imported_from' = 'guides_staging';

-- DELETE FROM public.staging_imports;
