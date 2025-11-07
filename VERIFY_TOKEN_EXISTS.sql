-- Quick check: Does the profile_claim_tokens table exist and have data?

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profile_claim_tokens'
) as table_exists;

-- 2. Count total tokens
SELECT COUNT(*) as total_tokens FROM profile_claim_tokens;

-- 3. Show all tokens with status
SELECT
  LEFT(token, 30) || '...' as token_preview,
  license_number,
  expires_at,
  claimed_at,
  CASE
    WHEN claimed_at IS NOT NULL THEN 'Claimed'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Valid & Unclaimed'
  END as status
FROM profile_claim_tokens
ORDER BY created_at DESC
LIMIT 20;

-- 4. If you want to check a specific token, uncomment and replace TOKEN_HERE:
-- SELECT * FROM profile_claim_tokens
-- WHERE token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';
