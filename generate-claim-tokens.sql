-- ================================================
-- GENERATE PROFILE CLAIM TOKENS
-- ================================================

-- Step 1: Check if profile_claim_tokens table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profile_claim_tokens'
) as table_exists;

-- Step 2: Check what guides have license_number
SELECT
    COUNT(*) as total_guides,
    COUNT(license_number) as guides_with_license_number,
    COUNT(*) - COUNT(license_number) as guides_without_license
FROM guides;

-- Step 3: Check existing tokens
SELECT COUNT(*) as existing_tokens
FROM profile_claim_tokens;

-- Step 4: Sample a guide to verify license_number column exists
SELECT
    id,
    profile_id,
    license_number,
    headline
FROM guides
WHERE license_number IS NOT NULL
LIMIT 3;

-- Step 5: Generate claim tokens for ALL guides with license numbers
-- Skip guides that already have tokens
INSERT INTO profile_claim_tokens (
  profile_id,
  license_number,
  token,
  expires_at,
  created_at,
  updated_at
)
SELECT
  g.profile_id,
  g.license_number,
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM guides g
WHERE g.license_number IS NOT NULL
  AND g.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profile_claim_tokens pct
    WHERE pct.license_number = g.license_number
  );

-- Step 6: Verify tokens were created
SELECT COUNT(*) as total_tokens_created
FROM profile_claim_tokens;

-- Step 7: Check token distribution
SELECT
    CASE WHEN claimed_at IS NULL THEN 'Unclaimed' ELSE 'Claimed' END as status,
    COUNT(*) as count
FROM profile_claim_tokens
GROUP BY CASE WHEN claimed_at IS NULL THEN 'Unclaimed' ELSE 'Claimed' END;

-- Step 8: Sample tokens for testing
SELECT
    pct.token,
    pct.license_number,
    pct.expires_at,
    pct.claimed_at,
    p.full_name
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
WHERE pct.claimed_at IS NULL
LIMIT 5;

-- ================================================
-- SUCCESS CRITERIA:
-- ================================================
-- Step 2: Should show most guides have license_number
-- Step 6: Should show ~25,000+ tokens created
-- Step 7: Should show all as 'Unclaimed'
-- Step 8: Should show 5 sample tokens with license numbers
