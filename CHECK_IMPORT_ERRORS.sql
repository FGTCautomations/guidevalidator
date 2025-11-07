-- Check the import results and any errors
-- This assumes you have a staging_imports table tracking the import

-- 1. Check the most recent import stats
SELECT
  id,
  import_type,
  status,
  total_records,
  successful_imports,
  failed_imports,
  skipped_records,
  error_details,
  created_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 as duration_minutes
FROM staging_imports
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check for any profiles that failed to import
-- (Look for guides in staging that don't have profiles)
SELECT
  s.id,
  s.name,
  s.card_number,
  s.status as staging_status
FROM guides_staging s
WHERE s.status = 'failed'
  OR (s.status = 'pending' AND s.created_at < NOW() - INTERVAL '1 hour')
LIMIT 10;

-- 3. Check total claim tokens generated
SELECT
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN claimed_at IS NULL THEN 1 END) as unclaimed,
  COUNT(CASE WHEN claimed_at IS NOT NULL THEN 1 END) as claimed,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired
FROM profile_claim_tokens;

-- 4. Get a sample of valid tokens to test
SELECT
  LEFT(token, 40) || '...' as token_preview,
  license_number,
  expires_at,
  p.full_name
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
WHERE claimed_at IS NULL
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 5;
