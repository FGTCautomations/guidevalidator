-- ================================================
-- CREATE PROFILE CLAIM TOKENS TABLE
-- ================================================

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS profile_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_token
  ON profile_claim_tokens(token);

CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_license
  ON profile_claim_tokens(license_number);

CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_profile
  ON profile_claim_tokens(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_claimed
  ON profile_claim_tokens(claimed_at)
  WHERE claimed_at IS NULL;

-- Step 3: Verify table was created
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profile_claim_tokens'
ORDER BY ordinal_position;

-- Step 4: Now generate tokens for all guides
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

-- Step 5: Verify tokens were created
SELECT COUNT(*) as total_tokens FROM profile_claim_tokens;

-- Step 6: Sample tokens
SELECT
    pct.token,
    pct.license_number,
    pct.expires_at,
    p.full_name
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
WHERE pct.claimed_at IS NULL
LIMIT 5;

-- ================================================
-- SUCCESS:
-- Step 3: Should show table columns
-- Step 5: Should show ~25,000 tokens
-- Step 6: Should show 5 sample tokens
-- ================================================
