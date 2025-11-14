-- ================================================
-- FIX: Add missing columns to profile_claim_tokens
-- ================================================

-- Step 1: Check current columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profile_claim_tokens'
ORDER BY ordinal_position;

-- Step 2: Add missing profile_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_claim_tokens'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_claim_tokens
    ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_profile_claim_tokens_profile
      ON profile_claim_tokens(profile_id);

    RAISE NOTICE 'Added profile_id column';
  ELSE
    RAISE NOTICE 'profile_id column already exists';
  END IF;
END $$;

-- Step 3: Add other missing columns if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_claim_tokens'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profile_claim_tokens
    ADD COLUMN created_at timestamptz DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_claim_tokens'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profile_claim_tokens
    ADD COLUMN updated_at timestamptz DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Step 4: Verify all columns now exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profile_claim_tokens'
ORDER BY ordinal_position;

-- Step 5: Now try to generate tokens
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

-- Step 6: Count tokens
SELECT COUNT(*) as total_tokens FROM profile_claim_tokens;

-- Step 7: Sample
SELECT
    token,
    license_number,
    profile_id,
    expires_at,
    claimed_at
FROM profile_claim_tokens
LIMIT 5;
