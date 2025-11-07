-- Check if the claim token exists and its status
-- Token: VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=

-- 1. Check if token exists
SELECT
  pct.id,
  pct.token,
  pct.profile_id,
  pct.license_number,
  pct.expires_at,
  pct.claimed_at,
  pct.claimed_by,
  pct.created_at,
  CASE
    WHEN pct.claimed_at IS NOT NULL THEN 'Claimed'
    WHEN pct.expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status,
  p.full_name,
  p.email,
  p.country_code,
  p.role
FROM profile_claim_tokens pct
LEFT JOIN profiles p ON p.id = pct.profile_id
WHERE pct.token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 2. If no results above, check all tokens (to see what's available)
SELECT
  pct.id,
  LEFT(pct.token, 20) || '...' as token_preview,
  pct.license_number,
  pct.expires_at,
  pct.claimed_at,
  CASE
    WHEN pct.claimed_at IS NOT NULL THEN 'Claimed'
    WHEN pct.expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status,
  p.full_name
FROM profile_claim_tokens pct
LEFT JOIN profiles p ON p.id = pct.profile_id
ORDER BY pct.created_at DESC
LIMIT 10;

-- 3. Check if profile_claim_tokens table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profile_claim_tokens'
) as table_exists;
