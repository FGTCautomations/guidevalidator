-- Debug why claim token validation is failing
-- Replace YOUR_TOKEN_HERE with your actual token

-- 1. Check if token exists at all
SELECT
  'Token exists:' as check_name,
  COUNT(*) as result
FROM profile_claim_tokens
WHERE token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 2. Get token details without join
SELECT
  'Token details (no join):' as check_name,
  id,
  profile_id,
  license_number,
  expires_at,
  claimed_at,
  created_at,
  CASE
    WHEN claimed_at IS NOT NULL THEN 'Already Claimed'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM profile_claim_tokens
WHERE token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 3. Check if the profile exists
SELECT
  'Profile exists for token:' as check_name,
  pct.profile_id,
  CASE WHEN p.id IS NULL THEN 'NO - Profile Missing!' ELSE 'YES' END as profile_exists,
  p.full_name,
  p.role,
  p.country_code
FROM profile_claim_tokens pct
LEFT JOIN profiles p ON p.id = pct.profile_id
WHERE pct.token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 4. Try the exact query from the code (with inner join)
SELECT
  'Query from code (inner join):' as check_name,
  pct.id,
  pct.profile_id,
  pct.license_number,
  pct.expires_at,
  pct.claimed_at,
  p.id as profile_exists,
  p.full_name,
  p.country_code,
  p.application_data
FROM profile_claim_tokens pct
INNER JOIN profiles p ON p.id = pct.profile_id
WHERE pct.token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 5. Check for orphaned tokens (tokens without profiles)
SELECT
  'Orphaned tokens count:' as check_name,
  COUNT(*) as count
FROM profile_claim_tokens pct
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = pct.profile_id
);
