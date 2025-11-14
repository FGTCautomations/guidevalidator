-- ================================================
-- DROP AND RECREATE profile_claim_tokens TABLE
-- ================================================

-- Step 1: Drop existing table (safe since it has 0 records)
DROP TABLE IF EXISTS profile_claim_tokens CASCADE;

-- Step 2: Create table with correct schema
CREATE TABLE profile_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_profile_claim_tokens_token ON profile_claim_tokens(token);
CREATE INDEX idx_profile_claim_tokens_license ON profile_claim_tokens(license_number);
CREATE INDEX idx_profile_claim_tokens_profile ON profile_claim_tokens(profile_id);
CREATE INDEX idx_profile_claim_tokens_claimed ON profile_claim_tokens(claimed_at) WHERE claimed_at IS NULL;

-- Step 4: Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profile_claim_tokens'
ORDER BY ordinal_position;

-- Step 5: Generate tokens for all guides
INSERT INTO profile_claim_tokens (
  profile_id,
  license_number,
  token,
  expires_at
)
SELECT
  g.profile_id,
  g.license_number,
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '1 year'
FROM guides g
WHERE g.license_number IS NOT NULL
  AND g.profile_id IS NOT NULL;

-- Step 6: Count created tokens
SELECT COUNT(*) as total_tokens FROM profile_claim_tokens;

-- Step 7: Check token status
SELECT
    CASE WHEN claimed_at IS NULL THEN 'Unclaimed' ELSE 'Claimed' END as status,
    COUNT(*) as count
FROM profile_claim_tokens
GROUP BY CASE WHEN claimed_at IS NULL THEN 'Unclaimed' ELSE 'Claimed' END;

-- Step 8: Sample 5 tokens
SELECT
    pct.token,
    pct.license_number,
    pct.profile_id,
    pct.expires_at,
    p.full_name
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
LIMIT 5;

-- ================================================
-- SUCCESS CRITERIA:
-- Step 4: Should show all columns including profile_id
-- Step 6: Should show ~25,743 tokens
-- Step 7: Should show all as 'Unclaimed'
-- Step 8: Should show 5 sample tokens with guide names
-- ================================================
